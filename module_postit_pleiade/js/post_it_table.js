(function ($, Drupal, drupalSettings, once) {
  Drupal.behaviors.postitBehavior = {
    attach: function (context, settings) {
      
      // *** MODIFIED: Target the specific ID of your wrapper div (#postit_block_id). ***
      // If this ID does not exist on the page, the code inside .forEach() will NOT execute.
      const elements = once("postitBehavior", "#postit_block_id", context);

      elements.forEach((wrapper) => {
        // *** MODIFIED: Select elements specifically within the found wrapper ***
        // This ensures strict dependency on your HTML structure.
        const dashboard = wrapper.querySelector("#post_it_dashboard");
        const form = wrapper.querySelector("#myForm");
        const deleteBtn = wrapper.querySelector("#delete-button");
        const submitBtn = wrapper.querySelector("#submit_post_it");

        // If for some reason the wrapper exists but the inner dashboard is missing, stop.
        if (!dashboard) return;

        let zIndexCounter = 1;

        // Debounce function to limit how often saveItems is called
        function debounce(func, delay = 500) {
          let timeoutId;
          return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              func.apply(this, args);
            }, delay);
          };
        }

        const debouncedSave = debounce(saveItems);

        init();

        function init() {
          deleteBtn?.addEventListener("click", deleteAllItems);
          form?.addEventListener("submit", handleFormSubmit);
          dashboard?.addEventListener("click", handleItemClick);
          submitBtn?.addEventListener("click", () =>
            dashboard.classList.add("show")
          );
          retrieveItems();
        }

        function handleFormSubmit(e) {
          e.preventDefault();
          // We look inside the wrapper for the inputs to be safe
          const messageInput = wrapper.querySelector("#message");
          const colorInput = wrapper.querySelector("#color");
          
          const message = messageInput.value.trim();
          const color = colorInput.value;
          
          if (!message) return;

          const item = createItem(message, 10, 5, color);
          dashboard.appendChild(item);
          makeEditable(item);
          enableDrag(item);
          
          messageInput.value = "";
          saveItems();
        }

        function handleItemClick(e) {
          if (e.target.classList.contains("remove-btn")) {
            const item = e.target.closest(".item");
            item?.remove();
            saveItems();
          }
        }

        function makeEditable(item) {
          const p = item.querySelector("p");
          p.setAttribute("contenteditable", "true");
          p.addEventListener("input", debouncedSave);
          p.addEventListener("blur", saveItems);
        }

        function createItem(message, topPercent, leftPercent, color) {
          const item = document.createElement("div");
          item.classList.add("item");
          item.style.background = color;
          item.style.position = "absolute";
          item.style.top = `${topPercent}%`;
          item.style.left = `${leftPercent}%`;
          item.style.zIndex = zIndexCounter++;
          item.style.padding = "0.5rem";
          item.style.width = "180px";
          item.style.height = "150px";
          item.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
          item.style.borderRadius = "8px";
          item.style.cursor = "grab";

          const tape = document.createElement("div");
          tape.classList.add("tape");
          item.appendChild(tape);

          const p = document.createElement("p");
          p.innerHTML = message.replace(/\n/g, "<br>");
          p.style.color = isLight(color) ? "#000" : "#fff";
          p.style.height = "100%";
          p.style.overflowY = "auto";
          p.style.fontSize = "12px";
          p.style.cursor = "text";
          item.appendChild(p);

          const removeBtn = document.createElement("span");
          removeBtn.classList.add("remove-btn");
          removeBtn.textContent = "X";
          removeBtn.style.position = "absolute";
          removeBtn.style.top = "4px";
          removeBtn.style.right = "8px";
          removeBtn.style.cursor = "pointer";
          removeBtn.style.color = p.style.color;
          item.appendChild(removeBtn);

          return item;
        }

        function isLight(color) {
          const rgb = hexToRgb(color);
          if (!rgb) return false;
          const luminance =
            (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
          return luminance > 0.5;
        }

        function hexToRgb(hex) {
          const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
          hex = hex.replace(
            shorthandRegex,
            (m, r, g, b) => r + r + g + g + b + b
          );
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
              }
            : null;
        }

        function deleteAllItems() {
          if (
            confirm("Êtes-vous sûr de vouloir supprimer tous les post-its ?")
          ) {
            dashboard.innerHTML = "";
            saveItems();
          }
        }

        function saveItems() {
          const items = [];
          if (!dashboard) return;
          const itemElements = dashboard.getElementsByClassName("item");

          for (let item of itemElements) {
            const p = item.querySelector("p");
            const message = p.innerHTML;
            const color = item.style.background;
            const top = (item.offsetTop / dashboard.offsetHeight) * 100;
            const left = (item.offsetLeft / dashboard.offsetWidth) * 100;
            const textColor = p.style.color;

            items.push({ message, color, top, left, text_color: textColor });
          }

          $.ajax({
            url: "/v1/module_postit_pleiade/save_postit",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ items }),
            success: () => console.log("Post-it items saved successfully!"),
            error: (xhr, status, error) =>
              console.error("Error saving post-it items:", error),
          });
        }

        function retrieveItems() {
          $.ajax({
            url: "/v1/module_postit_pleiade/retrieve_postit",
            type: "GET",
            success: function (response) {
              try {
                const data =
                  typeof response === "string"
                    ? JSON.parse(response)
                    : response;
                if (Array.isArray(data.items)) {
                  data.items.forEach((itemData) => {
                    const item = createItem(
                      itemData.message,
                      itemData.top,
                      itemData.left,
                      itemData.color
                    );
                    const p = item.querySelector("p");
                    p.style.color = itemData.text_color;
                    const removeBtn = item.querySelector(".remove-btn");
                    removeBtn.style.color = itemData.text_color;
                    makeEditable(item);
                    enableDrag(item);
                    dashboard?.appendChild(item);
                  });
                  if (data.items.length > 0) dashboard?.classList.add("show");
                }
              } catch (error) {
                console.error("Error parsing response:", error);
              }
            },
            error: function (error) {
              console.error("Error retrieving post-it items:", error);
            },
          });
        }

        function enableDrag(element) {
          let offsetX = 0,
            offsetY = 0;
          let isDragging = false;
          
          element.addEventListener("mousedown", function (e) {
            if (e.target.tagName === "P" || e.target.classList.contains("remove-btn")) {
              return;
            }

            e.preventDefault();
            isDragging = true;
            zIndexCounter++;
            element.style.zIndex = zIndexCounter;
            element.style.cursor = "grabbing";

            const rect = element.getBoundingClientRect();
            // Important: Use the scoped dashboard element
            const dashboardRect = dashboard.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            function onMouseMove(e) {
              if (!isDragging) return;
              const x = e.clientX - dashboardRect.left - offsetX;
              const y = e.clientY - dashboardRect.top - offsetY;

              const itemWidth = element.offsetWidth;
              const itemHeight = element.offsetHeight;
              const dashWidth = dashboard.offsetWidth;
              const dashHeight = dashboard.offsetHeight;

              const maxLeft = dashWidth - itemWidth;
              const maxTop = dashHeight - itemHeight;

              const boundedX = Math.max(0, Math.min(x, maxLeft));
              const boundedY = Math.max(0, Math.min(y, maxTop));

              const xPct = (boundedX / dashWidth) * 100;
              const yPct = (boundedY / dashHeight) * 100;

              element.style.left = `${xPct}%`;
              element.style.top = `${yPct}%`;
            }

            function onMouseUp() {
              if (isDragging) {
                isDragging = false;
                element.style.cursor = "grab";
                saveItems();
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
              }
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          });
        }
      });
    },
  };
})(jQuery, Drupal, drupalSettings, once);