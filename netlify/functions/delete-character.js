exports.handler = async (event) => {
  try {
    const { id, expectedUpdatedAt } = JSON.parse(event.body || "{}");

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing character ID."
        })
      };
    }

    const characterId = String(id);

    if (!/^[a-zA-Z0-9_-]+$/.test(characterId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Character ID contains invalid characters."
        })
      };
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const characterPath = `characters/${characterId}.json`;

    async function getFile(path) {
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

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return await response.json();
    }

    const existingFile = await getFile(characterPath);

    if (!existingFile?.sha) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Character file was not found."
        })
      };
    }

    const existingCharacter = JSON.parse(
      Buffer.from(existingFile.content, "base64").toString("utf8")
    );

    if (existingCharacter.id !== characterId) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error:
            "Delete blocked: the filename and internal character ID do not match."
        })
      };
    }

    if (
      expectedUpdatedAt &&
      existingCharacter.updatedAt &&
      expectedUpdatedAt !== existingCharacter.updatedAt
    ) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error:
            "Delete blocked: someone else updated this character after you opened it. " +
            "Return to the index and reopen the character before deleting it."
        })
      };
    }

    const response = await fetch(
      `https://api.github.com/repos/${repo}/contents/${characterPath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `[skip netlify] Delete character ${characterId}`,
          sha: existingFile.sha,
          branch
        })
      }
    );

    if (response.status === 409) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error:
            "Delete blocked: another update happened at almost the same time. " +
            "Refresh the index and try again."
        })
      };
    }

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
