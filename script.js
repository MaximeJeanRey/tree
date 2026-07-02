/* ==========================================================================
   UN ARBRE, UN TEMPS — script.js
   --------------------------------------------------------------------------
   JavaScript natif, sans framework ni dépendance. Tout le fichier est encapsulé
   dans une IIFE pour ne rien exposer dans l'espace global.

   Ce fichier fait quatre choses :
     1. Calcule depuis DATE_DEBUT le nombre de jours écoulés, l'étape de
        croissance de l'arbre (1 à 52) et la saison actuelle.
     2. Affiche l'image d'arbre et le fond saisonnier correspondants.
     3. Charge les textes (âge, phrase poétique) depuis data/video.json.
     4. Anime de discrètes particules selon la saison (neige, pollen, lumière
        flottante, feuilles).
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. CONFIGURATION — les seules valeurs à modifier pour personnaliser
        l'expérience.
     ---------------------------------------------------------------------- */

  // Date de départ de l'histoire (le jour où l'arbre a été planté).
  // Format : 'AAAA-MM-JJTHH:mm:ss'. Modifiez cette seule ligne.
  const DATE_DEBUT = new Date('2024-06-01T00:00:00');

  // Nombre total d'étapes de croissance (une image par semaine).
  const NB_ETAPES_ARBRE = 52;

  // Chemins relatifs (sans '/' au début : reste valable si le site est publié
  // à la racine d'un domaine *ou* dans un sous-dossier de type GitHub Pages,
  // ex. https://utilisateur.github.io/nom-du-repo/).
  const DOSSIER_ARBRE = 'assets/tree/';
  const DOSSIER_FONDS = 'assets/backgrounds/';
  const FICHIER_TEXTES = 'data/video.json';

  const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

  /* ------------------------------------------------------------------------
     Paramètres de prévisualisation (facultatifs, jamais visibles à l'écran).
     Utiles pendant le développement pour voir n'importe quelle étape ou
     saison sans attendre : ?jour=200 ou ?saison=autumn dans l'URL.
     N'affectent jamais l'interface : aucun bouton, aucun réglage visible.
     ---------------------------------------------------------------------- */
  const PARAMS = new URLSearchParams(window.location.search);


  /* ------------------------------------------------------------------------
     2. CALCULS TEMPORELS
     ---------------------------------------------------------------------- */

  function joursEcoules() {
    if (PARAMS.has('jour')) {
      const force = parseInt(PARAMS.get('jour'), 10);
      if (!Number.isNaN(force)) return Math.max(0, force);
    }
    const diff = Date.now() - DATE_DEBUT.getTime();
    return Math.max(0, Math.floor(diff / MS_PAR_JOUR));
  }

  function etapeArbre(jours) {
    const semaine = Math.floor(jours / 7) + 1;
    // Une fois la dernière étape atteinte, l'arbre reste majestueux : on ne
    // dépasse jamais NB_ETAPES_ARBRE.
    return Math.min(Math.max(semaine, 1), NB_ETAPES_ARBRE);
  }

  // Saisons météorologiques, hémisphère nord (France). Pour l'hémisphère sud,
  // il suffit de décaler les mois de six mois dans cette fonction.
  function saisonActuelle(date) {
    if (PARAMS.has('saison')) return PARAMS.get('saison');
    const mois = date.getMonth(); // 0 = janvier ... 11 = décembre
    if (mois === 11 || mois === 0 || mois === 1) return 'winter';
    if (mois >= 2 && mois <= 4) return 'spring';
    if (mois >= 5 && mois <= 7) return 'summer';
    return 'autumn';
  }


  /* ------------------------------------------------------------------------
     3. AFFICHAGE DE L'ARBRE
     ---------------------------------------------------------------------- */

  function afficherArbre(etape) {
    const img = document.getElementById('arbre');
    const numero = String(etape).padStart(3, '0');
    const url = `${DOSSIER_ARBRE}tree-${numero}.png`;

    // Préchargement pour éviter tout scintillement ou image cassée visible.
    const precharge = new Image();
    precharge.onload = () => {
      img.src = url;
      // Un double rAF garantit que le navigateur a bien peint l'état initial
      // (opacité 0) avant de déclencher la transition d'apparition.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => img.classList.add('arbre-visible'));
      });
    };
    precharge.onerror = () => {
      console.warn(`[Un arbre, un temps] Image introuvable : ${url}`);
      img.classList.add('arbre-visible');
    };
    precharge.src = url;

    img.alt = `L'arbre, à sa ${etape}e semaine de croissance`;
  }


  /* ------------------------------------------------------------------------
     4. FOND SAISONNIER (fondu croisé entre deux calques)
     ---------------------------------------------------------------------- */

  let calqueActif = 'a';

  function appliquerSaison(saison) {
    const fondA = document.getElementById('fond-a');
    const fondB = document.getElementById('fond-b');
    const entrant = calqueActif === 'a' ? fondB : fondA;
    const sortant = calqueActif === 'a' ? fondA : fondB;

    const url = `${DOSSIER_FONDS}${saison}.jpg`;

    const precharge = new Image();
    precharge.onload = () => {
      entrant.style.backgroundImage = `url('${url}')`;
      requestAnimationFrame(() => {
        entrant.style.opacity = '1';
        sortant.style.opacity = '0';
      });
      calqueActif = calqueActif === 'a' ? 'b' : 'a';
    };
    precharge.onerror = () => {
      console.warn(`[Un arbre, un temps] Fond introuvable : ${url}`);
    };
    precharge.src = url;

    // Utile si l'on souhaite un jour cibler la saison en CSS pur.
    document.body.dataset.saison = saison;
  }


  /* ------------------------------------------------------------------------
     5. TEXTES DISCRETS (âge + phrase poétique), chargés depuis le JSON
     ---------------------------------------------------------------------- */

  function texteParDefaut() {
    return {
      afficherAge: true,
      phraseUnique: "Chaque jour, un peu plus haut vers le ciel.",
      utiliserPhraseParSaison: false,
      phrasesParSaison: {}
    };
  }

  async function chargerTextes() {
    try {
      const reponse = await fetch(FICHIER_TEXTES, { cache: 'no-store' });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      const donnees = await reponse.json();
      return { ...texteParDefaut(), ...donnees };
    } catch (erreur) {
      // En local sans serveur (ouverture directe du fichier index.html), le
      // navigateur bloque fetch() sur file://. On retombe alors sur des
      // valeurs par défaut plutôt que de casser l'expérience.
      console.info(
        '[Un arbre, un temps] data/video.json non chargé ' +
        '(normal en ouverture locale sans serveur) — valeurs par défaut utilisées.'
      );
      return texteParDefaut();
    }
  }

  function choisirPhrase(donnees, saison) {
    if (donnees.utiliserPhraseParSaison) {
      const liste = donnees.phrasesParSaison && donnees.phrasesParSaison[saison];
      if (Array.isArray(liste) && liste.length > 0) {
        return liste[Math.floor(Math.random() * liste.length)];
      }
    }
    return donnees.phraseUnique || '';
  }

  function afficherTextes(jours, saison, donnees) {
    const elPhrase = document.getElementById('phrase-poetique');
    const elAge = document.getElementById('age-arbre');

    elPhrase.textContent = choisirPhrase(donnees, saison);
    elAge.textContent = donnees.afficherAge
      ? `${jours} jour${jours > 1 ? 's' : ''}`
      : '';

    // Apparition douce et décalée dans le temps : la phrase, puis l'âge,
    // comme on tournerait lentement la page d'un carnet.
    window.setTimeout(() => elPhrase.classList.add('visible'), 900);
    window.setTimeout(() => elAge.classList.add('visible'), 1700);
  }


  /* ------------------------------------------------------------------------
     6. PARTICULES SAISONNIÈRES
     --------------------------------------------------------------------
     Un seul moteur de particules, paramétré différemment selon la saison :
       - hiver  : neige, chute lente, léger balancement
       - printemps : pollen / pétales, dérive plus marquée, légère rotation
       - été    : lumière flottante et lucioles, remontée très lente, scintillement
       - automne : feuilles, chute avec rotation plus prononcée
     Volontairement discret : peu de particules, faible opacité, mouvement lent.
     ---------------------------------------------------------------------- */

  const REGLAGES_PARTICULES = {
    winter: { nombre: 34, couleur: [255, 255, 255], opaciteMax: 0.5, vitesseY: [10, 24], derive: 12, taille: [1.4, 3], rotation: false, scintillement: false },
    spring: { nombre: 24, couleur: [255, 226, 233], opaciteMax: 0.55, vitesseY: [8, 18], derive: 26, taille: [3, 6], rotation: true, scintillement: false },
    summer: { nombre: 16, couleur: [255, 240, 180], opaciteMax: 0.55, vitesseY: [-7, -2], derive: 10, taille: [1, 2.6], rotation: false, scintillement: true },
    autumn: { nombre: 26, couleur: [178, 108, 58], opaciteMax: 0.5, vitesseY: [12, 22], derive: 30, taille: [4, 7], rotation: true, scintillement: false }
  };

  function demarrerParticules(saison) {
    const canvas = document.getElementById('particules');
    const ctx = canvas.getContext('2d');

    const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (mouvementReduit) return; // on respecte le confort de l'utilisateur

    const reglages = REGLAGES_PARTICULES[saison] || REGLAGES_PARTICULES.autumn;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    function redimensionner() {
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    redimensionner();
    window.addEventListener('resize', redimensionner);
    window.addEventListener('orientationchange', redimensionner);

    function aleatoire(min, max) {
      return min + Math.random() * (max - min);
    }

    function nouvelleParticule(departAleatoire) {
      return {
        x: Math.random() * window.innerWidth,
        y: departAleatoire ? Math.random() * window.innerHeight : -10,
        vitesseY: aleatoire(reglages.vitesseY[0], reglages.vitesseY[1]),
        taille: aleatoire(reglages.taille[0], reglages.taille[1]),
        angle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2
      };
    }

    const particules = Array.from({ length: reglages.nombre }, () => nouvelleParticule(true));

    let dernierTemps = performance.now();
    let actif = true;

    document.addEventListener('visibilitychange', () => {
      // On met en pause l'animation quand l'onglet/écran n'est pas visible :
      // bonne pratique de sobriété, particulièrement adaptée à un usage mobile.
      actif = document.visibilityState === 'visible';
      if (actif) {
        dernierTemps = performance.now();
        requestAnimationFrame(animer);
      }
    });

    function animer(temps) {
      if (!actif) return;
      const dt = Math.min((temps - dernierTemps) / 1000, 0.05);
      dernierTemps = temps;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const p of particules) {
        p.y += p.vitesseY * dt;
        p.x += Math.sin(p.phase + temps / 2200) * reglages.derive * dt * 0.3;
        p.phase += dt;
        if (reglages.rotation) p.angle += dt * 0.5;

        // Recyclage discret dès qu'une particule sort de l'écran.
        if (p.y > window.innerHeight + 12 || p.y < -12) {
          Object.assign(p, nouvelleParticule(false));
          p.y = p.vitesseY >= 0 ? -10 : window.innerHeight + 10;
        }

        let opacite = reglages.opaciteMax;
        if (reglages.scintillement) {
          opacite *= 0.5 + 0.5 * Math.sin(temps / 650 + p.phase);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        if (reglages.rotation) {
          ctx.ellipse(0, 0, p.taille, p.taille * 0.5, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(0, 0, p.taille, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(${reglages.couleur[0]}, ${reglages.couleur[1]}, ${reglages.couleur[2]}, ${opacite.toFixed(2)})`;
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(animer);
    }

    requestAnimationFrame(animer);
  }


  /* ------------------------------------------------------------------------
     7. INITIALISATION
     ---------------------------------------------------------------------- */

  async function init() {
    const jours = joursEcoules();
    const etape = etapeArbre(jours);
    const saison = saisonActuelle(new Date());

    afficherArbre(etape);
    appliquerSaison(saison);
    demarrerParticules(saison);

    const donnees = await chargerTextes();
    afficherTextes(jours, saison, donnees);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
