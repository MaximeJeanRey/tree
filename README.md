# Un arbre, un temps

Une expérience contemplative en HTML / CSS / JavaScript natif : un arbre qui
grandit avec le temps, dans un paysage dont la saison change avec le
calendrier réel. Pensée pour être ouverte d'un geste — via un tag NFC — sans
aucun écran d'accueil, aucun menu, aucun bouton.

---

## 1. Arborescence du projet

```
arbre-du-temps/
├── index.html                  → page unique, aucune navigation
├── style.css                   → direction artistique (aquarelle, désaturée)
├── script.js                   → calcul du temps, saisons, particules
├── data/
│   └── video.json              → textes modifiables (voir section 4)
├── assets/
│   ├── tree/
│   │   ├── tree-001.png        → semaine 1 (pousse)
│   │   ├── tree-002.png
│   │   ├── ...
│   │   └── tree-052.png        → semaine 52 (arbre majestueux, état final)
│   └── backgrounds/
│       ├── winter.jpg
│       ├── spring.jpg
│       ├── summer.jpg
│       └── autumn.jpg
└── README.md
```

**Important — images fournies :** les 52 images de l'arbre et les 4 fonds
saisonniers présents dans ce livrable sont des **placeholders générés par
code** (aquarelle procédurale simple), afin que le site soit fonctionnel dès
le premier déploiement. Ils sont destinés à être remplacés par de vraies
illustrations aquarelle, en conservant exactement les mêmes noms de fichiers
et le même dossier — aucune modification de code n'est nécessaire.

Format recommandé pour vos propres illustrations :
- `tree-001.png` à `tree-052.png` : PNG, fond transparent, format portrait
  (ex. 1200×1600), arbre cadré en bas de l'image.
- `winter.jpg`, `spring.jpg`, `summer.jpg`, `autumn.jpg` : JPG, format large
  (ex. 2400×1500), scène complète (ciel + sol), sans sujet au centre puisque
  l'arbre vient se superposer par-dessus.

---

## 2. Déploiement sur GitHub Pages

1. Créez un dépôt GitHub (public ou privé avec Pages activé selon votre
   offre) et déposez-y l'intégralité du contenu de ce dossier
   (`index.html` doit être à la racine du dépôt, ou à la racine du dossier
   choisi comme source).
2. Dans le dépôt : **Settings → Pages → Source**, choisissez la branche
   (ex. `main`) et le dossier (`/root`).
3. GitHub publie l'URL au format
   `https://votre-utilisateur.github.io/nom-du-depot/`.
4. Tous les chemins du projet sont **relatifs** (pas de `/` en tête), ce qui
   permet au site de fonctionner aussi bien à la racine d'un domaine que
   dans un sous-dossier de type GitHub Pages — aucune adaptation requise.

### Programmer le tag NFC

Une fois le site en ligne, il suffit d'écrire l'URL de la page (celle
obtenue à l'étape 3) sur le tag NFC intégré au vêtement, avec n'importe
quelle application d'écriture NFC (le tag stocke simplement un enregistrement
de type URL). Au scan, le téléphone ouvre directement cette page : il n'y a
rien d'autre à configurer côté site, puisqu'il n'existe aucun écran
intermédiaire.

### Tester en local avant publication

Le site utilise `fetch()` pour charger `data/video.json`, ce qui ne
fonctionne pas en ouvrant simplement `index.html` depuis l'explorateur de
fichiers (`file://`). Pour tester localement, lancez un petit serveur depuis
le dossier du projet :

```bash
python3 -m http.server 8000
```

puis ouvrez `http://localhost:8000` dans un navigateur. (En l'absence de
serveur, le site fonctionne quand même : il retombe silencieusement sur une
phrase par défaut intégrée au script.)

---

## 3. Personnaliser la date de départ et le rythme de croissance

Tout se passe en haut de `script.js` :

```js
const DATE_DEBUT = new Date('2024-06-01T00:00:00');
const NB_ETAPES_ARBRE = 52;
```

- `DATE_DEBUT` : le jour zéro de l'histoire. Le nombre de jours écoulés,
  l'étape de croissance et l'affichage de l'âge en découlent automatiquement.
- `NB_ETAPES_ARBRE` : le nombre d'images disponibles dans `assets/tree/`
  (une par semaine). Une fois cette dernière étape atteinte, l'arbre reste
  affiché dans son état final et n'évolue plus — seul le fond continue de
  changer avec les saisons, indéfiniment.

---

## 4. Modifier les textes (sans toucher au code)

Tout se passe dans `data/video.json` :

```json
{
  "afficherAge": true,
  "utiliserPhraseParSaison": false,
  "phraseUnique": "Chaque jour, un peu plus haut vers le ciel.",
  "phrasesParSaison": { "winter": ["..."], "spring": ["..."], "summer": ["..."], "autumn": ["..."] }
}
```

- `phraseUnique` : la phrase affichée en permanence. C'est le réglage le
  plus simple — modifiez simplement ce texte.
- `utiliserPhraseParSaison` : passez à `true` pour que le site pioche
  aléatoirement une phrase dans `phrasesParSaison[saison]` à chaque
  ouverture, plutôt que d'utiliser `phraseUnique`.
- `afficherAge` : passez à `false` pour masquer le compteur de jours.

Le nom du fichier (`video.json`) a été conservé tel que demandé dans le
brief d'origine ; il peut être renommé librement, à condition de mettre à
jour la constante `FICHIER_TEXTES` correspondante dans `script.js`.

---

## 5. Comportement automatique

- **Étape de l'arbre** : `floor(jours_écoulés / 7) + 1`, plafonnée à
  `NB_ETAPES_ARBRE`.
- **Saison** : déterminée par le mois de la date du jour (hémisphère nord —
  décembre à février = hiver, etc.). Pour l'hémisphère sud, décalez les
  mois de six mois dans la fonction `saisonActuelle()` de `script.js`.
- **Transition entre saisons** : fondu croisé de 3,5 s entre deux calques de
  fond superposés, précédé d'un préchargement de l'image pour éviter tout
  scintillement.
- **Particules** : un seul moteur discret, reparamétré selon la saison
  (neige en hiver, pollen/pétales au printemps, lumière flottante et
  lucioles en été, feuilles en automne). Désactivées automatiquement si
  l'utilisateur a activé la préférence système « mouvement réduit ».

---

## 6. Prévisualisation pendant le développement (facultatif)

Pour visualiser une étape ou une saison précise sans attendre, deux
paramètres d'URL sont acceptés — ils ne créent aucun bouton ni réglage
visible, ils servent uniquement au développement :

```
index.html?jour=200
index.html?saison=autumn
index.html?jour=364&saison=winter
```

---

## 7. Aucune donnée personnelle, aucun compte

Le site est statique, sans base de données, sans cookie, sans compte
utilisateur. Un seul visiteur est prévu ; il n'y a donc ni authentification
ni écran de connexion à concevoir.
