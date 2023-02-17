(function ($, Drupal, once) {
    "use strict";
    
    Drupal.behaviors.APIPastellEntitieDataBehavior = {
      attach: function (context, settings) {
        // exclude admin pages  
          
        
          if (!drupalSettings.path.currentPath.includes("admin")) {  
            $('#collectiviteChoice option').addClass("collectivite_hide");
            once("APIPastellEntitieDataBehavior", "body", context).forEach(function () {
             
              var optionValue = localStorage.getItem('collectivite_id');
              document.cookie = 'coll_id=' + optionValue;
              $('#collectiviteChoice').append('<option class="dropdown-item text-uppercase" id="'
              + optionValue + '" selected="selected">' 
              + localStorage.getItem('collectivite_name') + '</option>');
              
            //------------------------------------------------------
            //Requete pour récupérer les collectivités du user actif
            //------------------------------------------------------
  
            $.ajax({
              url: Drupal.url("api_pastell_pleiade/pastell_entities_query"), // on appelle l'API de notre module LemonDataApiManager.php
              dataType: "json", // on spécifie bien que le type de données est en JSON
              type: "GET",
              data: {},
              success: function (donnees) {
                
                var linkEntitie = "";
                var mother_entities = [];
                var child_entities = [];
  
                $.each( donnees, function( key, value ) {
                  if (value.entite_mere == 0){
                    linkEntitie +=
                    '<option id="entitie_number_' +
                    value.id_e +
                    '" class="dropdown-item text-uppercase" value="' +
                    value.id_e +
                    '">' +
                    value.denomination +
                    '</option>';
                    $.each( donnees, function( key, value_child ) {
                      if (value_child.entite_mere == value.id_e){
                        linkEntitie +=
                        '<option id="entitie_number_' +
                        value_child.id_e +
                        '" class="dropdown-item text-uppercase" value="' +
                        value_child.id_e +
                        '">---->' +
                        value_child.denomination +
                        '</option>';
                      }
                    });
                    // mother_entities.push( { 
                    //   valeur: value.id_e
                    // } 
                    // );
                    // console.log(value.denomination);
                  }

                });

                // $.each( mother_entities, function( key, value ) {
                // console.log(value.valeur);
                // //  console.log(donnees[value.valeur].entite_mere);
                //  linkEntitie +=
                //     '<option id="entitie_number_' +
                //     donnees[value.valeur].id_e +
                //     '" class="dropdown-item text-uppercase" value="' +
                //     donnees[value.valeur].id_e +
                //     '">' +
                //     donnees[value.valeur].denomination +
                //     '</option>';
                // });
                $.each( child_entities, function( key, value ) {
                  //console.log(value.child);
                  console.log(donnees[value.child]);
                  //  linkEntitie +=
                  //     '<option id="entitie_number_' +
                  //     donnees[value.child].id_e +
                  //     '" class="dropdown-item text-uppercase" value="' +
                  //     donnees[value.child].id_e +
                  //     '">' +
                  //     donnees[value.child].denomination +
                  //     '</option>';
                  });
               
                // for (var i = 0; i < donnees.length; i++) {
                //   linkEntitie +=
                //     '<option id="entitie_number_' +
                //     donnees[i].id_e +
                //     '" class="dropdown-item text-uppercase" value="' +
                //     donnees[i].id_e +
                //     '">' +
                //     donnees[i].denomination +
                //     '</option>';
                // }
                document.getElementById("collectiviteChoice").innerHTML += linkEntitie;
                feather.replace();
              },
              
            });

          }); // fin once
        } // fin exlude admin pages
   
      },
    };
  })(jQuery, Drupal, once);