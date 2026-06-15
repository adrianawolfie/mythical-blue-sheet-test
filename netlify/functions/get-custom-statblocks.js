exports.handler = async () => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const path = "campaign/custom-statblocks.json";

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

    if (response.status === 404) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({ statblocks: [] })
      };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({ error: await response.text() })
      };
    }

    const file = await response.json();
    const statblocks = JSON.parse(
      Buffer.from(file.content || "W10=", "base64").toString("utf8") || "[]"
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ statblocks: Array.isArray(statblocks) ? statblocks : [] })
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
