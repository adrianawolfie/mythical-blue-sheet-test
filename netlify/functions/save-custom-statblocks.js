function cleanString(value, maxLength = 4000) {
  return String(value ?? "").slice(0, maxLength);
}

function cleanNumber(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.map(item => cleanString(item, 80).trim()).filter(Boolean).slice(0, 40)
    : [];
}

function normalizeStatblock(statblock, index) {
  const fallbackId = `custom-statblock-${Date.now()}-${index}`;
  const rawId = cleanString(statblock.id || fallbackId, 120).trim();
  const safeId = /^[a-zA-Z0-9_-]+$/.test(rawId) ? rawId : fallbackId;

  return {
    id: safeId,
    name: cleanString(statblock.name || "Custom Monster", 160),
    section: "Custom Monsters",
    size: cleanString(statblock.size || "Medium", 80),
    type: cleanString(statblock.type || "Creature", 120),
    alignment: cleanString(statblock.alignment || "Unaligned", 120),
    armorClass: cleanString(statblock.armorClass ?? "", 80),
    initiative: cleanString(statblock.initiative ?? "", 80),
    hp: cleanString(statblock.hp ?? "", 80),
    hpFormula: cleanString(statblock.hpFormula || "", 160),
    speed: cleanString(statblock.speed || "", 200),
    challengeRating: cleanString(statblock.challengeRating || "", 80),
    proficiencyBonus: cleanString(statblock.proficiencyBonus || "", 20),
    description: cleanString(statblock.description || "", 1600),
    text: cleanString(statblock.text || "", 24000),
    source: "Custom Monster",
    legendaryResistanceMax: cleanNumber(statblock.legendaryResistanceMax),
    legendaryActionMax: cleanNumber(statblock.legendaryActionMax),
    saveProficiencies: cleanList(statblock.saveProficiencies),
    skillProficiencies: cleanList(statblock.skillProficiencies),
    skillExpertise: cleanList(statblock.skillExpertise)
  };
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const incoming = Array.isArray(body) ? body : body.statblocks;

    if (!Array.isArray(incoming)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Custom statblocks payload must be a list." })
      };
    }

    if (incoming.length > 250) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Too many custom statblocks." })
      };
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const path = "campaign/custom-statblocks.json";

    const statblocks = incoming
      .map(normalizeStatblock)
      .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));

    async function getFile() {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "Cache-Control": "no-cache"
          }
        }
      );

      if (response.status === 404) return null;
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }

    const existingFile = await getFile();
    const putBody = {
      message: "[skip netlify] Save campaign custom statblocks",
      content: Buffer.from(JSON.stringify(statblocks, null, 2)).toString("base64"),
      branch
    };

    if (existingFile?.sha) putBody.sha = existingFile.sha;

    const response = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(putBody)
      }
    );

    if (response.status === 409) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "Custom monsters changed at the same time. Refresh and try again." })
      };
    }

    if (!response.ok) throw new Error(await response.text());

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ success: true, statblocks })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
