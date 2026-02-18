(function ($, Drupal, once) {
  "use strict";

  class WatchaMatrixController {
    constructor() {
      this.myUserId = null;
      this.myAccessToken = null;
      this.synapseServer = null;
      this.watchaUrl = null;
      this.nextBatch = null;
      this.myFilterId = null;
      
      this.globalNotifications = {};
      this.eventIdToRoomMap = {};
      this.roomInfoCache = {};
      this.userProfileCache = new Map();
      this.MAX_CACHE_SIZE = 100;
      
      this.DEFAULT_AVATAR_URL = "/sites/default/files/default_images/blank-profile-picture-gb0f9530de_640.png";

      this.container = null;
      this.watchaBar = null;
      this.wrapper = null; 
      
      this.isStarted = false;
    }

    init(wrapperId, containerId, barId) {
      this.wrapper = document.getElementById(wrapperId);
      this.container = document.getElementById(containerId);
      this.watchaBar = document.getElementById(barId);

      if (!this.wrapper || !this.container) return;

      this.checkAndStart();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && mutation.attributeName === "style") {
            this.checkAndStart();
          }
        });
      });

      observer.observe(this.wrapper, {
        attributes: true,
        attributeFilter: ["style"]
      });
    }

    checkAndStart() {
      if (this.isStarted) return;
      this.isStarted = true;
      this.initMatrixClient();
    }

    async fetchMatrixConfig() {
      const res = await fetch("/v1/api_watcha_pleiade/getConfig");
      if (res.status === 401) {
        window.location.href = Drupal.url("v1/api_watcha_pleiade/watcha_auth_flow");
        return null;
      }
      const { data } = await res.json();
      return data;
    }

    async initMatrixClient() {
      try {
        const config = await this.fetchMatrixConfig();
        if (!config) return;

        this.myUserId = config.myUserId;
        this.myAccessToken = config.myAccessToken;
        this.synapseServer = config.synapseServer;
        this.watchaUrl = config.watchaUrl;

        if (this.myUserId == null) {
          window.location.href = Drupal.url("v1/api_watcha_pleiade/watcha_auth_flow");
        }

        if (window.innerWidth < 768) {
          const $carousel = jQuery(this.container);
          try {
            await this.waitForSlick($carousel);
          } catch (e) {
            console.error("Slick not ready:", e.message);
          }
        }

        this.startSyncLoop();
      } catch (err) {
        console.error("Matrix initialization error:", err);
      }
    }

    async startSyncLoop() {
      try {
        this.myFilterId = await this.getOrCreateFilter(this.myUserId, this.myAccessToken);
        if (!this.myFilterId) {
          throw new Error("Could not get a filter ID. Sync cannot start.");
        }

        const initUrl = `${this.synapseServer}/_matrix/client/v3/sync?filter=${this.myFilterId}`;

        const initialRes = await fetch(initUrl, {
          headers: { Authorization: `Bearer ${this.myAccessToken}` },
        });

        if (!initialRes.ok) {
          window.location.href = Drupal.url("v1/api_watcha_pleiade/watcha_auth_flow");
        }

        const initialData = await initialRes.json();
        this.nextBatch = initialData.next_batch;
        
        let notifications = await this.handleSyncResponse(initialData, true);
        
        if (window.innerWidth > 768) {
          this.renderMessages(notifications);
        } else {
          this.renderMessagesPhone(notifications);
        }

        await this.syncLoop();
      } catch (err) {
        console.error("Sync loop error:", err.message);
      }
    }

    async syncLoop() {
      let sinceToken = this.nextBatch;

      while (true) {
        try {
          if (!sinceToken) {
            console.error("Sync loop cannot continue without a 'since' token.");
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          const syncTimeout = 30000;
          const url = `${this.synapseServer}/_matrix/client/v3/sync?filter=${this.myFilterId}&since=${sinceToken}&timeout=${syncTimeout}`;

          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${this.myAccessToken}` },
          });

          if (!res.ok) {
            console.error(`Sync request failed with status: ${res.status}`);
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          const data = await res.json();
          sinceToken = data.next_batch;
          this.nextBatch = data.next_batch;

          const notifications = await this.handleSyncResponse(data, false);

          if (window.innerWidth > 768) {
            this.renderMessages(notifications);
          } else {
            this.renderMessagesPhone(notifications);
          }

        } catch (err) {
          console.error("Sync loop network error:", err.message);
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    }

    getMxcUrl(mxcUrl) {
      if (!mxcUrl) return null;
      if (!mxcUrl.startsWith("mxc")) return this.DEFAULT_AVATAR_URL;
      const mediaId = mxcUrl.replace("mxc://", "");
      return `${this.synapseServer}/_matrix/media/v3/download/${mediaId}`;
    }

    processTimelineInOnePass(timelineEvents, myUserId) {
      const result = {
        lastMessage: null,
        editsMap: {},
        redactedEventIds: new Set(),
      };

      for (let i = timelineEvents.length - 1; i >= 0; i--) {
        const event = timelineEvents[i];

        if (event.type === "m.room.redaction" && event.redacts) {
          result.redactedEventIds.add(event.redacts);
          continue;
        }

        if (
          event.type === "m.room.message" &&
          event.content?.["m.relates_to"]?.rel_type === "m.replace"
        ) {
          const targetId = event.content["m.relates_to"].event_id;
          if (!result.editsMap[targetId]) {
            result.editsMap[targetId] = event.content;
          }
        }

        if (
          !result.lastMessage &&
          event.type === "m.room.message" &&
          event.sender !== myUserId
        ) {
          const rel = event.content?.["m.relates_to"]?.rel_type;
          if (rel !== "m.thread" && rel !== "m.replace") {
            result.lastMessage = event;
          }
        }
      }
      return result;
    }

    cacheUserProfile(userId, data) {
      if (this.userProfileCache.size >= this.MAX_CACHE_SIZE) {
        const oldestKey = this.userProfileCache.keys().next().value;
        this.userProfileCache.delete(oldestKey);
      }
      this.userProfileCache.set(userId, data);
    }

    async fetchMissingUserProfiles(userIds, accessToken) {
      const profilesToFetch = Array.from(userIds).map((userId) => {
        const url = `${this.synapseServer}/_matrix/client/v3/profile/${encodeURIComponent(userId)}`;
        return fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
          .then((res) => (res.ok ? res.json() : null))
          .then((profile) => ({ userId, profile }))
          .catch((err) => {
            console.warn(`Failed to fetch profile for ${userId}:`, err.message);
            return { userId, profile: null };
          });
      });

      const results = await Promise.all(profilesToFetch);

      for (const { userId, profile } of results) {
        if (profile) {
          this.cacheUserProfile(userId, {
            displayname: profile.displayname,
            avatar_url: profile.avatar_url || this.DEFAULT_AVATAR_URL,
          });
        } else {
          this.cacheUserProfile(userId, {
            displayname: userId,
            avatar_url: this.DEFAULT_AVATAR_URL,
          });
        }
      }
    }

    async handleSyncResponse(data, isInitial = false) {
      const joinedRooms = data.rooms?.join ?? {};
      const leavedRooms = data.rooms?.leave ?? {};
      const inviteRooms = data.rooms?.invite ?? {};

      for (const roomId in leavedRooms) {
        delete this.globalNotifications[roomId];
      }

      const roomsToFormat = [];
      const profilesToFetch = new Set();

      for (const [roomId, roomData] of Object.entries(joinedRooms)) {
        const notifCount = roomData.unread_notifications?.notification_count ?? 0;

        const stateEvents = [...roomData.state?.events ?? [], ...roomData.timeline?.events ?? []];
        for (const event of stateEvents) {
          if (event.type === "m.room.name") {
            this.roomInfoCache[roomId] = { name: event.content?.name ?? roomId };
          }
          if (event.type === "m.room.member") {
            if (event.content?.displayname || event.content?.avatar_url) {
              this.cacheUserProfile(event.state_key, {
                displayname: event.content.displayname,
                avatar_url: event.content.avatar_url || this.DEFAULT_AVATAR_URL,
              });
            }
            if (!this.userProfileCache.has(event.state_key)) {
              profilesToFetch.add(event.state_key);
            }
          }
        }

        if (notifCount === 0) {
          delete this.globalNotifications[roomId];
          continue;
        }

        const timelineData = this.processTimelineInOnePass(
          roomData.timeline?.events ?? [],
          this.myUserId
        );

        if (timelineData.lastMessage && !this.userProfileCache.has(timelineData.lastMessage.sender)) {
          profilesToFetch.add(timelineData.lastMessage.sender);
        }

        roomsToFormat.push({ roomId, roomData, timelineData, notifCount });
      }

      if (profilesToFetch.size > 0) {
        await this.fetchMissingUserProfiles(profilesToFetch, this.myAccessToken);
      }

      for (const { roomId, roomData, timelineData, notifCount } of roomsToFormat) {
        const { lastMessage, editsMap, redactedEventIds } = timelineData;
        const roomName = this.roomInfoCache[roomId]?.name ?? roomId;
        const currentNotif = this.globalNotifications[roomId];
        const currentLastId = currentNotif?.event_id;

        if (currentNotif) {
          if (redactedEventIds.has(currentLastId)) {
            currentNotif.message = "message supprimé";
          } else if (editsMap[currentLastId]) {
            currentNotif.message = editsMap[currentLastId]["m.new_content"]?.body ?? currentNotif.message;
          }
          currentNotif.unread = notifCount;
        }

        if (lastMessage && lastMessage.event_id !== currentLastId) {
          const senderId = lastMessage.sender;
          const senderData = this.userProfileCache.get(senderId) || {
            displayname: senderId,
            avatar_url: this.DEFAULT_AVATAR_URL,
          };

          this.globalNotifications[roomId] = {
            type: "unread",
            room_id: roomId,
            room_name: roomName === roomId ? "direct" : roomName,
            unread: notifCount,
            message: lastMessage.content?.body ?? "",
            sender: senderData.displayname ?? senderId,
            avatar_url: this.getMxcUrl(senderData.avatar_url),
            sender_id: senderId,
            timestamp: lastMessage.origin_server_ts,
            event_id: lastMessage.event_id,
          };
          this.eventIdToRoomMap[lastMessage.event_id] = roomId;
        }
      }

      for (const [roomId, inviteData] of Object.entries(inviteRooms)) {
        if (this.globalNotifications[roomId]?.type === "invite") continue;

        let roomName = "Invite";
        let inviterId = null;
        let timestamp = null;

        for (const event of inviteData.invite_state?.events ?? []) {
          if (
            event.type === "m.room.member" &&
            event.content?.membership === "invite" &&
            event.state_key === this.myUserId
          ) {
            inviterId = event.sender;
            timestamp = event.origin_server_ts;
            break;
          }
        }

        if (!inviterId) continue;

        let inviterDisplayName = inviterId;
        let inviterAvatarUrl = this.DEFAULT_AVATAR_URL;
        for (const event of inviteData.invite_state?.events ?? []) {
          if (event.type === "m.room.name") {
            roomName = event.content?.name ?? roomName;
            this.roomInfoCache[roomId] = { name: roomName };
          }
          if (event.type === "m.room.member" && event.state_key === inviterId) {
            inviterDisplayName = event.content?.displayname ?? inviterId;
            inviterAvatarUrl = event.content?.avatar_url || this.DEFAULT_AVATAR_URL;
          }
        }

        this.globalNotifications[roomId] = {
          type: "invite",
          room_id: roomId,
          room_name: roomName,
          sender: inviterDisplayName,
          avatar_url: this.getMxcUrl(inviterAvatarUrl),
          sender_id: inviterId,
          timestamp,
          unread: 1,
        };
      }

      return { ...this.globalNotifications };
    }

    renderMessagesPhone(notifications) {
      let mergedNotifications = Object.values(notifications);

      if (mergedNotifications.length === 0) {
        this.showEmptyMessage();
        return;
      }

      this.updateTabTitle(mergedNotifications.length);

      const $carousel = jQuery(this.container);
      if ($carousel.hasClass("slick-initialized")) {
        $carousel.slick("unslick");
      }

      this.container.innerHTML = "";
      
      const fragment = document.createDocumentFragment();

      mergedNotifications
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach((event) => {
          const card = this.createMessageCard({
            count: event.unread,
            avatarUrl: event.avatar_url,
            senderName: event.sender,
            subject: "[" + (event.room_name === "(no name)" ? event.sender : event.room_name) + "] " +
                     (event.type === "invite" ? "Nouvelle invitation" : "Nouveau message"),
            message: event.message || "",
            time: this.formatTimestamp(event.timestamp),
            roomId: event.room_id,
            eventId: event.event_id,
            onClick: () => this.openRoomAndClean(event.room_id),
          });

          const slideWrapper = document.createElement("div");
          slideWrapper.appendChild(card);
          fragment.appendChild(slideWrapper);
        });

      this.container.appendChild(fragment);

      $carousel.slick({
        vertical: true,
        slidesToShow: 2,
        slidesToScroll: 1,
        arrows: false,
        infinite: false,
      });

      this.container.dataset.empty = "1";
    }

    renderMessages(notifications) {
      const mergedNotifications = Object.values(notifications);

      if (mergedNotifications.length === 0) {
        this.showEmptyMessage();
        return;
      }

      this.updateTabTitle(mergedNotifications.length);

      const fragment = document.createDocumentFragment();

      mergedNotifications
        .sort((b, a) => new Date(b.timestamp) - new Date(a.timestamp))
        .forEach((event) => {
          const card = this.createMessageCard({
            count: event.unread,
            avatarUrl: event.avatar_url,
            senderName: event.sender,
            subject: `[${event.room_name === "(no name)" ? event.sender : event.room_name}] ${event.type === "invite" ? "Nouvelle invitation" : "Nouveau message"}`,
            message: event.message || "",
            time: this.formatTimestamp(event.timestamp),
            roomId: event.room_id,
            eventId: event.event_id,
            onClick: () => this.openRoomAndClean(event.room_id),
          });

          fragment.insertBefore(card, fragment.firstChild);
        });

      this.container.innerHTML = "";
      this.container.appendChild(fragment);
      this.container.dataset.empty = "1";
    }

   createMessageCard({ count, avatarUrl, senderName, subject, message, time, roomId, eventId, onClick }) {
    const card = document.createElement("div");
    card.className = "message-card";
    card.dataset.roomId = roomId;
    card.dataset.count = count;
    card.dataset.event = eventId || ""; 

    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Ouvrir le message de ${senderName} : ${subject}`);

    const triggerAction = (e) => {
      e.preventDefault();
      if (window.getSelection().toString().length === 0) {
          onClick();
      }
    };

    card.addEventListener("click", triggerAction);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        triggerAction(e);
      }
    });

    let displayMessage = message;
    if (displayMessage && displayMessage.includes("<@")) {
      displayMessage = displayMessage.split(">")[2] || displayMessage;
    }

    const isMobile = window.innerWidth < 768;
    const avatarHTML = isMobile
      ? ""
      : `
      <div class="d-flex align-items-center profile-picture">
        <img src="${avatarUrl}" alt="" class="profile-pic rounded-circle" width="50" height="50" />
      </div>`;

    card.innerHTML = `
    <div class="list-group-item d-flex flex-column gap-1 py-2 px-3 mail_content text-decoration-none text-dark border-0 bg-transparent">
      <div class="d-flex justify-content-between align-items-center">
        ${avatarHTML}
        <div class="fw-bold">${senderName}</div>
        <div class="fw-semibold text-truncate ms-2" style="max-width: 40%;">${subject}</div>
        <small class="text-secondary ms-auto">${time}</small>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-1">
        <div class="text-secondary fs-6 text-truncate" style="opacity: 0.9;">${displayMessage}</div>
        ${count > 0 ? `<div class="d-flex justify-content-end"><span class="badge bg-primary rounded-pill">${count}</span></div>` : ''}
      </div>
    </div>`;

    return card;
}

    openRoomAndClean(roomId) {
      window.open(`${this.watchaUrl}${roomId}`, "watcha");
    }

    updateTabTitle(inc) {
      const newCount = inc;
     
      document.querySelectorAll(".noth-span").forEach((el) => el.remove());

      if (typeof window.setNotificationCount === 'function') {
        window.setNotificationCount('watcha', newCount);
      }
    }

    showEmptyMessage() {
      this.container.dataset.empty = "0";
      this.container.innerHTML = `
    <div class="d-flex justify-content-center">
      <p class="my-5 h3-style">Aucun nouveau message</p>
    </div>`;
      this.updateTabTitle(0);
    }

    formatTimestamp(ts) {
        const date = new Date(ts);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    waitForSlick($carousel, timeout = 3000) {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        (function check() {
          if ($carousel.hasClass("slick-initialized")) {
            resolve();
          } else if (Date.now() - start > timeout) {
            reject(new Error("Slick did not initialize in time."));
          } else {
            setTimeout(check, 100);
          }
        })();
      });
    }

    async getOrCreateFilter(userId, accessToken) {
      const filterDefinition = {
        presence: { not_types: ["*"] },
        account_data: { not_types: ["*"] },
        to_device: { not_types: ["*"] },
        room: {
          state: {
            types: ["m.room.name", "m.room.member"],
            lazy_load_members: true,
          },
          timeline: {
            types: [
              "m.room.message",
              "m.room.redaction",
              "m.room.member",
              "m.room.name",
            ],
            limit: 20,
            unread_thread_notifications: true,
          },
          leave: {},
          ephemeral: {
            types: ["*"],
          },
        },
      };

      const currentFilterHash = this.createFilterHash(filterDefinition);
      const savedFilterId = localStorage.getItem("myAppFilterId");
      const savedFilterHash = localStorage.getItem("myAppFilterHash");

      if (savedFilterId && savedFilterHash === currentFilterHash) {
        return savedFilterId;
      }

      const url = `${this.synapseServer}/_matrix/client/v3/user/${encodeURIComponent(userId)}/filter`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filterDefinition),
        });

        if (!res.ok) throw new Error(`Failed to create filter: ${res.status}`);
        const data = await res.json();
        const newFilterId = data.filter_id;

        localStorage.setItem("myAppFilterId", newFilterId);
        localStorage.setItem("myAppFilterHash", currentFilterHash);

        return newFilterId;
      } catch (err) {
        console.error("Could not create filter:", err);
        return null;
      }
    }

    createFilterHash(filterDef) {
      const sortedJsonString = JSON.stringify(filterDef, Object.keys(filterDef).sort());
      let hash = 0;
      for (let i = 0; i < sortedJsonString.length; i++) {
        const char = sortedJsonString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return hash.toString();
    }
  }

  Drupal.behaviors.WatchaBlocksBehavior = {
    attach: function (context, settings) {
      once("WatchaBlocksSlick", ".vertical-carousel", context).forEach(function (elem) {
          const $carousel = $(elem);
          if ($carousel.hasClass("slick-initialized")) return;

          if (window.innerWidth <= 768) {
            $carousel.css("overflow", "hidden");
          }
          
          if ($.fn.slick) {
            $carousel.slick({
                vertical: true,
                slidesToShow: 2,
                slidesToScroll: 1,
                arrows: false,
                infinite: false,
            });
            const $container = $carousel.closest(".vertical-carousel-container");
            $container.find("#slick-up").on("click", () => $carousel.slick("slickPrev"));
            $container.find("#slick-down").on("click", () => $carousel.slick("slickNext"));
          }
      });

      once("WatchaClientInit", "#watcha_div_id", context).forEach(function () {
          const controller = new WatchaMatrixController();
          controller.init("watcha_div_id", "watcha_block_id", "watcha");
      });
    },
  };

})(jQuery, Drupal, once);