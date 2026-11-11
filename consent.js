/* Amorvino — consenso cookie (GDPR, Linee guida Garante 2021), stesso impianto di uniqueborn.com.
   Libreria: orestbida/cookieconsent v3.1.0 (MIT) in vendor/cookieconsent/.
   Google Consent Mode v2: tutto negato finché il visitatore non sceglie.
   Il banner compare solo dopo la conferma della maggiore età (lo decide la pagina con l'evento «amorvino:maggiorenne»).
   ID di Google Analytics 4, Google Ads e Meta Pixel: in config.json (ga4Id, googleAdsId, googleAdsLeadLabel, metaPixelId).
   I tracciamenti partono solo sul dominio vero (siteUrl in config.json), mai in anteprima. */
(function () {
  var SRC = (document.currentScript && document.currentScript.src) || location.href;
  var IT = (document.documentElement.lang || 'it').slice(0, 2) !== 'en';
  var PRIVACY = new URL(IT ? 'privacy/' : 'en/privacy/', SRC).href;
  var COOKIEP = new URL(IT ? 'cookie/' : 'en/cookie/', SRC).href;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 });

  var CFG = null;
  var cfgReady = (window.__AMORVINO_CFG__ ? Promise.resolve(window.__AMORVINO_CFG__) : fetch(new URL('config.json', SRC).href).then(function (r) { return r.json(); }).catch(function () { return {}; }))
    .then(function (c) { CFG = c || {}; return CFG; });
  var dominioVero = function () { try { return !!CFG.siteUrl && new URL(CFG.siteUrl).hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, ''); } catch (e) { return false; } };

  /* eventi utili alle campagne: clic su WhatsApp e telefono (contatti), indicazioni stradali (visita in negozio) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    var href = a.getAttribute('href') || '', tipo = null;
    if (/wa\.me\/|api\.whatsapp\.com/.test(href)) tipo = 'whatsapp';
    else if (/^tel:/.test(href)) tipo = 'telefono';
    else if (/google\.[a-z.]+\/maps\/dir/.test(href)) tipo = 'indicazioni';
    if (!tipo) return;
    if (window.__ga4) gtag('event', 'contatto', { tipo: tipo, testo: (a.textContent || '').trim().slice(0, 60) });
    if (window.__ads && CFG.googleAdsLeadLabel) gtag('event', 'conversion', { send_to: CFG.googleAdsId + '/' + CFG.googleAdsLeadLabel });
    if (window.__fbq && window.fbq) fbq('track', tipo === 'indicazioni' ? 'FindLocation' : 'Contact');
  }, true);

  function gtagJs(id) { var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.appendChild(s); gtag('js', new Date()); }
  function applica() {
    var an = CookieConsent.acceptedCategory('analytics'), mk = !!(CFG && (CFG.googleAdsId || CFG.metaPixelId)) && CookieConsent.acceptedCategory('marketing');
    gtag('consent', 'update', { analytics_storage: an ? 'granted' : 'denied', ad_storage: mk ? 'granted' : 'denied', ad_user_data: mk ? 'granted' : 'denied', ad_personalization: mk ? 'granted' : 'denied' });
    cfgReady.then(function () {
      if (!dominioVero()) return;
      if (an && CFG.ga4Id && !window.__ga4) { window.__ga4 = true; if (!window.__gtagjs) { window.__gtagjs = true; gtagJs(CFG.ga4Id); } gtag('config', CFG.ga4Id); }
      if (mk && CFG.googleAdsId && !window.__ads) { window.__ads = true; if (!window.__gtagjs) { window.__gtagjs = true; gtagJs(CFG.googleAdsId); } gtag('config', CFG.googleAdsId); }
      if (mk && CFG.metaPixelId && !window.__fbq) { window.__fbq = true; !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', CFG.metaPixelId); fbq('track', 'PageView'); }
    });
  }

  /* Il banner chiede il consenso solo per ciò che il sito usa davvero: la categoria «Marketing» compare
     solo quando in config.json c'è un ID di Google Ads o Meta Pixel. In quel caso «revision» passa a 2
     e il banner richiede il consenso a tutti (anche a chi aveva già scelto), come vuole il Garante. */
  function avvia() {
    if (window.__ccRun || !window.CookieConsent) return; window.__ccRun = true;
    window.__ccReady = cfgReady.then(costruisci);
  }
  function costruisci() {
    var MK = !!(CFG.googleAdsId || CFG.metaPixelId);
    var cats = {
      necessary: { enabled: true, readOnly: true },
      analytics: { autoClear: { cookies: [{ name: /^_ga/ }, { name: '_gid' }], reloadPage: false } }
    };
    if (MK) cats.marketing = { autoClear: { cookies: [{ name: /^_fb/ }, { name: '_fbp' }, { name: /^_gcl/ }], reloadPage: false } };
    var solo = function (arr) { return arr.filter(function (x) { return x && (MK || x.linkedCategory !== 'marketing'); }); };
    return CookieConsent.run({
      revision: MK ? 2 : 1,
      cookie: { name: 'amorvino_consenso', expiresAfterDays: 182, sameSite: 'Lax' },
      guiOptions: {
        consentModal: { layout: 'box', position: 'bottom center', equalWeightButtons: true, flipButtons: false },
        preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false }
      },
      categories: cats,
      onFirstConsent: applica, onConsent: applica, onChange: applica,
      language: {
        default: IT ? 'it' : 'en',
        translations: {
          it: {
            consentModal: {
              title: 'Due parole sui cookie',
              description: 'Usiamo cookie tecnici per far funzionare il sito e, solo se accetti, cookie statistici di Google Analytics per capire quali pagine interessano di più' + (MK ? ' e cookie di marketing per misurare le pubblicità su Google, Facebook e Instagram' : '') + '. Se rifiuti, il sito funziona allo stesso modo. Puoi cambiare idea quando vuoi da «Preferenze cookie» in fondo alla pagina.',
              acceptAllBtn: 'Accetta tutti', acceptNecessaryBtn: 'Rifiuta', showPreferencesBtn: 'Scegli tu', closeIconLabel: 'Chiudi e rifiuta',
              footer: '<a href="' + PRIVACY + '">Privacy policy</a> <a href="' + COOKIEP + '">Cookie policy</a>'
            },
            preferencesModal: {
              title: 'Le tue preferenze sui cookie',
              acceptAllBtn: 'Accetta tutti', acceptNecessaryBtn: 'Rifiuta tutti', savePreferencesBtn: 'Salva le preferenze', closeIconLabel: 'Chiudi', serviceCounterLabel: 'servizio|servizi',
              sections: solo([
                { title: 'Come usiamo i cookie', description: 'Il sito è di Amorvino Enoteca, Camisano Vicentino. Scegli tu quali categorie attivare. Gli strumenti necessari non si possono disattivare: fanno funzionare il sito e ricordano questa scelta per 6 mesi.' },
                { title: 'Necessari <span class="pm__badge">Sempre attivi</span>', description: 'Ricordano la tua scelta sui cookie, la conferma della maggiore età, la lingua e la lista delle bottiglie. Non servono al marketing.', linkedCategory: 'necessary' },
                { title: 'Statistiche', description: 'Google Analytics 4: ci dice in forma aggregata quante persone visitano il sito e quali pagine e pulsanti usano. Non conserva il tuo indirizzo IP. Si attiva solo con il tuo consenso.', linkedCategory: 'analytics', cookieTable: { caption: 'Cookie statistici', headers: { name: 'Nome', desc: 'A cosa serve', exp: 'Durata' }, body: [ { name: '_ga', desc: 'Distingue i visitatori in forma anonima (Google Analytics)', exp: '2 anni' }, { name: '_ga_*', desc: 'Mantiene i dati della visita (Google Analytics)', exp: '2 anni' } ] } },
                MK ? { title: 'Marketing', description: 'Google Ads e Meta Pixel (Facebook e Instagram): misurano le nostre pubblicità e ci permettono di farle vedere a chi ha già visitato il sito. Restano spenti finché non li scegli tu.', linkedCategory: 'marketing', cookieTable: { caption: 'Cookie di marketing', headers: { name: 'Nome', desc: 'A cosa serve', exp: 'Durata' }, body: [ { name: '_gcl_*', desc: 'Misura le conversioni delle campagne (Google Ads)', exp: '90 giorni' }, { name: '_fbp', desc: 'Misura le campagne (Meta Pixel)', exp: '90 giorni' } ] } } : null,
                { title: 'Maggiori informazioni', description: 'Leggi la <a href="' + PRIVACY + '">privacy policy</a> e la <a href="' + COOKIEP + '">cookie policy</a>.' }
              ])
            }
          },
          en: {
            consentModal: {
              title: 'A word about cookies',
              description: 'We use technical cookies to run the site and, only if you accept, Google Analytics statistics cookies to see which pages interest people most' + (MK ? ' and marketing cookies to measure our ads on Google, Facebook and Instagram' : '') + '. If you reject, the site works just the same. You can change your mind any time from “Cookie preferences” at the bottom of the page.',
              acceptAllBtn: 'Accept all', acceptNecessaryBtn: 'Reject', showPreferencesBtn: 'Let me choose', closeIconLabel: 'Close and reject',
              footer: '<a href="' + PRIVACY + '">Privacy policy</a> <a href="' + COOKIEP + '">Cookie policy</a>'
            },
            preferencesModal: {
              title: 'Your cookie preferences',
              acceptAllBtn: 'Accept all', acceptNecessaryBtn: 'Reject all', savePreferencesBtn: 'Save preferences', closeIconLabel: 'Close', serviceCounterLabel: 'service|services',
              sections: solo([
                { title: 'How we use cookies', description: 'This site belongs to Amorvino Enoteca, Camisano Vicentino. Choose which categories to enable. Necessary tools cannot be switched off: they run the site and remember this choice for 6 months.' },
                { title: 'Necessary <span class="pm__badge">Always on</span>', description: 'They remember your cookie choice, your age confirmation, your language and your bottle list. No marketing use.', linkedCategory: 'necessary' },
                { title: 'Statistics', description: 'Google Analytics 4: it tells us, in aggregate form, how many people visit the site and which pages and buttons they use. It does not store your IP address. Only with your consent.', linkedCategory: 'analytics', cookieTable: { caption: 'Statistics cookies', headers: { name: 'Name', desc: 'Purpose', exp: 'Duration' }, body: [ { name: '_ga', desc: 'Tells visitors apart anonymously (Google Analytics)', exp: '2 years' }, { name: '_ga_*', desc: 'Keeps the visit data (Google Analytics)', exp: '2 years' } ] } },
                MK ? { title: 'Marketing', description: 'Google Ads and Meta Pixel (Facebook and Instagram): they measure our ads and let us show them to people who visited the site. Off until you choose otherwise.', linkedCategory: 'marketing', cookieTable: { caption: 'Marketing cookies', headers: { name: 'Name', desc: 'Purpose', exp: 'Duration' }, body: [ { name: '_gcl_*', desc: 'Measures campaign conversions (Google Ads)', exp: '90 days' }, { name: '_fbp', desc: 'Measures campaigns (Meta Pixel)', exp: '90 days' } ] } } : null,
                { title: 'More information', description: 'Read the <a href="' + PRIVACY + '">privacy policy</a> and the <a href="' + COOKIEP + '">cookie policy</a>.' }
              ])
            }
          }
        }
      }
    });
  }

  /* ordine: prima la maggiore età, poi l'animazione della bottiglia (circa 4 secondi), solo dopo il banner dei cookie,
     così il banner non copre la hero. Chi ha già scelto sui cookie non vede nessun banner: si parte subito. */
  var ATTESA_HERO = 4300;
  var maggiorenne = false; try { maggiorenne = localStorage.getItem('amorvino_eta') === 'si'; } catch (e) {}
  var giaScelto = /(?:^|;\s*)amorvino_consenso=/.test(document.cookie);
  var dopoHero = function () { setTimeout(avvia, document.querySelector('.p1-hero') && !giaScelto ? ATTESA_HERO : 0); };
  if (maggiorenne || /\/privacy\//.test(location.pathname)) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dopoHero); else dopoHero();
  } else addEventListener('amorvino:maggiorenne', dopoHero);
  window.amorvinoCookie = function () { if (window.CookieConsent) { avvia(); window.__ccReady.then(function () { CookieConsent.showPreferences(); }); } };
})();
