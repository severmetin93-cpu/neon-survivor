/* NORYVX — P3/P3S globals + p3Attach (fixes ReferenceError spam) */
(function (g) {
  var thresholds = [1500, 5000, 13000, 30000, 65000];
  var archetypes = {
    vanguard: { name: "VANGUARD", desc: "Dayanıklılık odaklı.", damage: 1.0, damageTaken: 0.9, speed: 1.0, control: 1.0, maxHp: 1.1 },
    striker: { name: "STRIKER", desc: "Saldırı odaklı.", damage: 1.08, damageTaken: 1.0, speed: 1.05, control: 1.0, maxHp: 1.0 },
    controller: { name: "CONTROLLER", desc: "Kontrol odaklı.", damage: 1.0, damageTaken: 1.0, speed: 1.0, control: 1.1, maxHp: 1.0 }
  };
  var skills = {
    pulse_mastery: { name: "Pulse Mastery", desc: "Pulse hasarı +2%.", type: "weapon", weapon: "pulse", max: 5 },
    plasma_mastery: { name: "Plasma Mastery", desc: "Plasma hasarı +2%.", type: "weapon", weapon: "plasma", max: 5 },
    arc_mastery: { name: "Arc Mastery", desc: "Arc hasarı +2%.", type: "weapon", weapon: "arc", max: 5 },
    nova_mastery: { name: "Nova Mastery", desc: "Nova hasarı +2%.", type: "weapon", weapon: "novaWeapon", max: 5 },
    survivor: { name: "Survivor", desc: "Maksimum can +3%.", type: "hp", max: 5 },
    focus: { name: "Focus", desc: "CD %1 azalır.", type: "cooldown", max: 5 },
    magnetism: { name: "Magnetism", desc: "Pickup çekim alanı +4%.", type: "magnet", max: 5 }
  };

  if (!g.P3) {
    g.P3 = { archetypes: archetypes, masteryThresholds: thresholds, skills: skills };
  } else {
    if (!g.P3.masteryThresholds) g.P3.masteryThresholds = thresholds;
    if (!g.P3.archetypes) g.P3.archetypes = archetypes;
    if (!g.P3.skills) g.P3.skills = skills;
  }

  if (!g.P3S) {
    try {
      var raw = localStorage.getItem("noryvx_phase3_v1");
      g.P3S = raw ? Object.assign({
        archetype: "vanguard", level: 1, xp: 0, skillPoints: 0,
        skills: {}, mastery: {}, masteryXP: {}, profileVersion: 3
      }, JSON.parse(raw)) : {
        archetype: "vanguard", level: 1, xp: 0, skillPoints: 0,
        skills: {}, mastery: {}, masteryXP: {}, profileVersion: 3
      };
    } catch (e) {
      g.P3S = {
        archetype: "vanguard", level: 1, xp: 0, skillPoints: 0,
        skills: {}, mastery: {}, masteryXP: {}, profileVersion: 3
      };
    }
  }

  if (typeof g.p3Attach !== 'function') {
    g.p3Attach = function (node, fn, withAudio) {
      if (!node || typeof fn !== 'function') return;
      if (node.__p3Attached) return;
      node.__p3Attached = true;
      node.addEventListener('click', function (e) {
        try {
          if (withAudio && g.Audio_ && typeof g.Audio_.ui === 'function') g.Audio_.ui();
        } catch (err) {}
        try { fn(e); } catch (err2) {}
      });
    };
  }
})(typeof window !== "undefined" ? window : this);

var P3 = window.P3;
var P3S = window.P3S;
var P3_KEY = window.P3_KEY || "noryvx_phase3_v1";
var p3Attach = window.p3Attach;
