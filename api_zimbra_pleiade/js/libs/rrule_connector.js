/*!
FullCalendar RRule Plugin v6.1.8
Docs & License: https://fullcalendar.io/docs/rrule-plugin
(c) 2023 Adam Shaw
*/
FullCalendar.RRule = (function (e, r, t, i) {
  "use strict";
  function n(e) {
    if (e && e.__esModule) return e;
    var r = Object.create(null);
    return (
      e &&
        Object.keys(e).forEach(function (t) {
          if ("default" !== t) {
            var i = Object.getOwnPropertyDescriptor(e, t);
            Object.defineProperty(
              r,
              t,
              i.get
                ? i
                : {
                    enumerable: !0,
                    get: function () {
                      return e[t];
                    },
                  }
            );
          }
        }),
      (r.default = e),
      r
    );
  }
  var l = n(t);
  const u = {
    parse(e, r) {
      if (null != e.rrule) {
        let t = (function (e, r) {
          let t,
            n = !1,
            u = !1;
          if ("string" == typeof e.rrule) {
            let r = (function (e) {
              let r = l.rrulestr(e, { forceset: !0 }),
                t = (function (e) {
                  let r = !1,
                    t = !1;
                  function n(e, n, l) {
                    let u = i.parseMarker(l);
                    (r = r || !u.isTimeUnspecified),
                      (t = t || null !== u.timeZoneOffset);
                  }
                  return (
                    e.replace(/\b(DTSTART:)([^\n]*)/, n),
                    e.replace(/\b(EXDATE:)([^\n]*)/, n),
                    e.replace(/\b(UNTIL=)([^;\n]*)/, n),
                    { isTimeSpecified: r, isTimeZoneSpecified: t }
                  );
                })(e);
              return Object.assign({ rruleSet: r }, t);
            })(e.rrule);
            (t = r.rruleSet),
              (n = r.isTimeSpecified),
              (u = r.isTimeZoneSpecified);
          }
          if ("object" == typeof e.rrule && e.rrule) {
            let i = a(e.rrule, r);
            (t = new l.RRuleSet()),
              t.rrule(i.rrule),
              (n = i.isTimeSpecified),
              (u = i.isTimeZoneSpecified);
          }
          let f = [].concat(e.exdate || []),
            s = [].concat(e.exrule || []);
          for (let e of f) {
            let r = i.parseMarker(e);
            (n = n || !r.isTimeUnspecified),
              (u = u || null !== r.timeZoneOffset),
              t.exdate(
                new Date(
                  r.marker.valueOf() - 60 * (r.timeZoneOffset || 0) * 1e3
                )
              );
          }
          for (let e of s) {
            let i = a(e, r);
            (n = n || i.isTimeSpecified),
              (u = u || i.isTimeZoneSpecified),
              t.exrule(i.rrule);
          }
          return { rruleSet: t, isTimeSpecified: n, isTimeZoneSpecified: u };
        })(e, r);
        if (t)
          return {
            typeData: {
              rruleSet: t.rruleSet,
              isTimeZoneSpecified: t.isTimeZoneSpecified,
            },
            allDayGuess: !t.isTimeSpecified,
            duration: e.duration,
          };
      }
      return null;
    },
    expand(e, r, t) {
      let i;
      return (
        (i = e.isTimeZoneSpecified
          ? e.rruleSet
              .between(t.toDate(r.start), t.toDate(r.end), !0)
              .map((e) => t.createMarker(e))
          : e.rruleSet.between(r.start, r.end, !0)),
        i
      );
    },
  };
  function a(e, r) {
    let t = !1,
      n = !1;
    function u(e) {
      if ("string" == typeof e) {
        let r = i.parseMarker(e);
        return r
          ? ((t = t || !r.isTimeUnspecified),
            (n = n || null !== r.timeZoneOffset),
            new Date(r.marker.valueOf() - 60 * (r.timeZoneOffset || 0) * 1e3))
          : null;
      }
      return e;
    }
    let a = Object.assign(Object.assign({}, e), {
      dtstart: u(e.dtstart),
      until: u(e.until),
      freq: s(e.freq),
      wkst: null == e.wkst ? (r.weekDow - 1 + 7) % 7 : s(e.wkst),
      byweekday: f(e.byweekday),
    });
    return {
      rrule: new l.RRule(a),
      isTimeSpecified: t,
      isTimeZoneSpecified: n,
    };
  }
  function f(e) {
    return Array.isArray(e) ? e.map(s) : s(e);
  }
  function s(e) {
    return "string" == typeof e ? l.RRule[e.toUpperCase()] : e;
  }
  const c = {
    rrule: i.identity,
    exrule: i.identity,
    exdate: i.identity,
    duration: i.createDuration,
  };
  var o = r.createPlugin({
    name: "@fullcalendar/rrule",
    recurringTypes: [u],
    eventRefiners: c,
  });
  return (
    r.globalPlugins.push(o),
    (e.default = o),
    Object.defineProperty(e, "__esModule", { value: !0 }),
    e
  );
})({}, FullCalendar, rrule, FullCalendar.Internal);
