// Profile / profileStats / aboutCard operations for the about-dashboard APIs.
// Update fields are whitelisted via `if (data.x !== undefined)`. Missing rows
// throw so route catches return 500s.

type Row = Record<string, unknown>;
type DbEvent = Parameters<typeof useDb>[0];

const nowIso = () => new Date().toISOString();

function buildUpdate(data: Row, fields: string[]) {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const field of fields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = ?`);
      values.push(data[field] ?? null);
    }
  }
  return { sets, values };
}

export async function dbGetProfile(event: DbEvent): Promise<Row | null> {
  try {
    return await useDb(event).prepare(`SELECT * FROM Profile LIMIT 1`).first();
  } catch (error) {
    // swallow DB errors (transient) — callers
    // fall back to defaults.
    console.warn("Error fetching profile:", error);
    return null;
  }
}

export async function dbUpdateProfile(event: DbEvent, id: string, data: Row): Promise<Row> {
  const { sets, values } = buildUpdate(data, [
    "name",
    "title",
    "bio",
    "email",
    "phone",
    "dateOfBirth",
    "gender",
    "address",
    "githubUrl",
    "linkedinUrl",
    "whatsappUrl",
    "profileImage",
  ]);
  const row = await useDb(event)
    .prepare(`UPDATE Profile SET ${[...sets, "updatedAt = ?"].join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values, nowIso(), id)
    .first();
  if (!row) throw new Error("Profile not found");
  return row;
}

export async function dbGetProfileStats(event: DbEvent): Promise<Row | null> {
  try {
    return await useDb(event).prepare(`SELECT * FROM ProfileStats LIMIT 1`).first();
  } catch (error) {
    console.warn("Error fetching profile stats:", error);
    return null;
  }
}

export async function dbUpdateProfileStats(event: DbEvent, id: string, data: Row): Promise<Row> {
  const { sets, values } = buildUpdate(data, [
    "pipelinesFixed",
    "projectsCount",
    "selfCommits",
    "experience",
  ]);
  const row = await useDb(event)
    .prepare(
      `UPDATE ProfileStats SET ${[...sets, "updatedAt = ?"].join(", ")} WHERE id = ? RETURNING *`,
    )
    .bind(...values, nowIso(), id)
    .first();
  if (!row) throw new Error("ProfileStats not found");
  return row;
}

// Singleton row is usually created by the first resume download; this covers
// saving stats before that ever happened.
export async function dbCreateProfileStats(event: DbEvent, data: Row): Promise<Row> {
  const row = await useDb(event)
    .prepare(
      `INSERT INTO ProfileStats ("id", "pipelinesFixed", "projectsCount", "selfCommits", "experience", "resumeDownloads", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, ?) RETURNING *`,
    )
    .bind(
      crypto.randomUUID(),
      data.pipelinesFixed ?? "0",
      data.projectsCount ?? 0,
      data.selfCommits ?? 0,
      data.experience ?? "0",
      nowIso(),
    )
    .first();
  if (!row) throw new Error("ProfileStats insert failed");
  return row;
}

export async function dbGetAboutCards(event: DbEvent): Promise<Row[]> {
  const { results } = await useDb(event)
    .prepare(`SELECT * FROM AboutCard ORDER BY displayOrder ASC`)
    .all();
  return results;
}

export async function dbCreateAboutCard(
  event: DbEvent,
  data: {
    title: string;
    icon: string;
    iconColor: string;
    content: string;
    displayOrder?: number;
  },
): Promise<Row> {
  const db = useDb(event);
  const id = crypto.randomUUID();
  const now = nowIso();
  // schema default displayOrder = 0 applies when undefined
  const displayOrder = typeof data.displayOrder === "number" ? data.displayOrder : 0;
  await db
    .prepare(
      `INSERT INTO AboutCard (id, title, icon, iconColor, content, displayOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, data.title, data.icon, data.iconColor, data.content, displayOrder, now, now)
    .first();
  return {
    id,
    title: data.title,
    icon: data.icon,
    iconColor: data.iconColor,
    content: data.content,
    displayOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export async function dbUpdateAboutCard(event: DbEvent, id: string, data: Row): Promise<Row> {
  const { sets, values } = buildUpdate(data, [
    "title",
    "icon",
    "iconColor",
    "content",
    "displayOrder",
  ]);
  const row = await useDb(event)
    .prepare(`UPDATE AboutCard SET ${[...sets, "updatedAt = ?"].join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values, nowIso(), id)
    .first();
  if (!row) throw new Error("AboutCard not found");
  return row;
}

export async function dbDeleteAboutCard(event: DbEvent, id: string): Promise<void> {
  const row = await useDb(event)
    .prepare(`DELETE FROM AboutCard WHERE id = ? RETURNING id`)
    .bind(id)
    .first();
  if (!row) throw new Error("AboutCard not found");
}
