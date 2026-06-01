exports.handler = async (event) => {
  try {
    const id = event.queryStringParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({
          error: "Missing character ID."
        })
      };
    }

    const characterId = String(id);

    if (!/^[a-zA-Z0-9_-]+$/.test(characterId)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({
          error: "Character ID contains invalid characters."
        })
      };
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const path = `characters/${characterId}.json`;

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

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({
          error: await response.text()
        })
      };
    }

    const file = await response.json();

    const character = JSON.parse(
      Buffer.from(file.content, "base64").toString("utf8")
    );

    if (character.id !== characterId) {
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({
          error:
            "Character file mismatch: the filename and internal ID do not match."
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(character)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
