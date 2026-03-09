export function createTemplate(input = {}) {
  const placeholders = Array.isArray(input.placeholders)
    ? [...new Set(input.placeholders
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean))]
    : [];

  return {
    id: input.id || crypto.randomUUID(),
    title: typeof input.title === "string" ? input.title.trim() : "",
    content: typeof input.content === "string" ? input.content : "",
    placeholders,
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
}

export function sanitizeImportedTemplates(rawValue) {
  if (!Array.isArray(rawValue)) {
    throw new Error("Invalid template file format.");
  }

  const seenIds = new Set();
  const templates = [];

  for (const item of rawValue) {
    const template = createTemplate(item);

    if (!template.title || !template.content) {
      continue;
    }

    if (seenIds.has(template.id)) {
      continue;
    }

    seenIds.add(template.id);
    templates.push(template);
  }

  return templates;
}

export function sanitizeImportedLibrary(rawValue) {
  if (Array.isArray(rawValue)) {
    return {
      templates: sanitizeImportedTemplates(rawValue),
      userTags: [],
    };
  }

  if (!rawValue || typeof rawValue !== "object") {
    throw new Error("Invalid template file format.");
  }

  const userTags = Array.isArray(rawValue.userTags)
    ? [
        ...new Set(
          rawValue.userTags
            .filter((value) => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
        ),
      ]
    : [];

  return {
    templates: sanitizeImportedTemplates(rawValue.templates || []),
    userTags,
  };
}

export function serializeTemplates(templates) {
  return JSON.stringify(
    templates.map((template) => createTemplate(template)),
    null,
    2
  );
}

export function serializeLibrary({ templates, userTags }) {
  return JSON.stringify(
    {
      version: 2,
      userTags: Array.isArray(userTags)
        ? [...new Set(userTags.filter((value) => typeof value === "string"))]
        : [],
      templates: templates.map((template) => createTemplate(template)),
    },
    null,
    2
  );
}
