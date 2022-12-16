# API Pléiade pour SSO avec LemonLDAP

## Fonctionnement

Ce module a été créé pour récupérer les informations renvoyées par LemonLdap concernant l'utilisateur connecté. 

Pour se faire, le module appelle l'API interne de drupal qui elle même appelle l'api Externe de LemonLDAP. 

La réponse de L'API se fait au format JSON. Le module récupère cette réponse et la formate pour récupérer les différentes valeurs contenu dans le JSON. 

La première tache du module est des créer un menu contenant les applications renvoyé par Lemon.

Dans un premier temps le fichier JS appelle en ajax l'api interne contenant la réponse de LemonLDAP. 
La suite du code traite et créé le menu html avec les différentes clés et valeurs. 
le résultat est stocké dans une variable et intégré à une div, ici contenant l'id "blocLemonCustom", créé précédemment dans le template twig du thème.
Pour créer les blocs sur la page d'accueil, on utilise le même procédé : On créé une variable contenant le html à intégrer puis on l'insère dans une div contenant un id spécifique.

La spécificité de ces derniers blocs sont qu'ils doivent être drag and drop. 

## Librairie additionnelle

On utilise donc une librairie externe SortableJS : 
https://github.com/SortableJS/Sortable
https://sortablejs.github.io/Sortable/

Activer le mod php-curl : 
```
phpenmod curl
```

## Spécificités

On rend ensuite les blocs "draggable" en spécifiant la div ou les éléments sont draggable. 
On voulait faire en sorte que tout soit draggable : Les blocs parents comme les liens. 
On a donc créé deux zones draggable : une pour les blocs parents, et une pour les blocs (liens) enfants, que sont les blocs parents. 

## Exemple de requête

exemple d'une requête curl Lemon / Myapplications :

curl 'https://authdev.ecollectivites.fr/myapplications' -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8' -H 'Accept-Language: fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'DNT: 1' -H 'Connection: keep-alive' -H 'Cookie: llnglanguage=fr; lemonldap=076e890b80eb23483d352541795b70751f86c57cba94c2a0a20466d55ec4ae53' -H 'Upgrade-Insecure-Requests: 1' -H 'Sec-Fetch-Dest: document' -H 'Sec-Fetch-Mode: navigate' -H 'Sec-Fetch-Site: none' -H 'Sec-Fetch-User: ?1' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache'

## Admin

/admin/config/api_lemon_pleiade/settings