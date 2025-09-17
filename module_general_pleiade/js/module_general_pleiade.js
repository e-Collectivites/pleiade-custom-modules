(function (Drupal, drupalSettings, once) {
  "use strict";

  Drupal.behaviors.ParamsGenBehavior = {
    attach: function (context, settings) {
      if (drupalSettings.module_general_pleiade) {

        once("ParamsGenBehavior", "body", context).forEach(function () {

          if (settings.module_general_pleiade.color_theme) {
            const newColorCode = settings.module_general_pleiade.color_theme;
            const root = document.documentElement;
            root.style.setProperty("--global-color", newColorCode);
            root.style.setProperty("--text-menu-color", newColorCode);
          }

          const container = document.getElementById("areaSortable");

          if (container && window.innerWidth > 768) {
            let sortableInstance = new Sortable(container, {
              animation: 150,
              draggable: ".sortable-items",
             handle: ".card-header",   
              onEnd: function () {
                const ids = Array.from(
                  container.querySelectorAll(".sortable-items")
                ).map((el) => el.id);

                const order = JSON.stringify(ids);

                const formData = new FormData();
                formData.append("var", "field_dashboard_order");
                formData.append("value", order);

                fetch("/v1/api_user_pleiade/setVariablesValue", {
                  method: "POST",
                  body: formData,
                })
                  .then((response) => {
                    if (!response.ok) {
                      throw new Error("Network response was not ok: " + response.statusText);
                    }
                    return response.json();
                  })
                  .then((data) => {
                    console.log("Dashboard order saved successfully:", data);
                  })
                  .catch((error) => {
                    console.error("Error saving dashboard order:", error);
                  });
              },
            });
document.addEventListener("pointerdown", function (e) {
    const tabulator = e.target.closest(".tabulator");
    if (tabulator) {
        const row = tabulator.closest(".row");
        if (row && row.hasAttribute("draggable")) {
            row.setAttribute("draggable", "false"); // disable Sortable for this row
            console.log("Disabled dragging for row:", row);
        }
    }
}, true);
          }


        });

      }
    },
  };
})(Drupal, drupalSettings, once);
