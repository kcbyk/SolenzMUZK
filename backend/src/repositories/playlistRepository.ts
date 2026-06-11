import pool from '../db/pool.js';

export interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlaylistItemRow {
  id: string;
  playlist_id: string;
  video_id: string;
  title: string;
  channel_name: string;
  duration_sec: number;
  thumbnail_url: string | null;
  position: number;
  added_at: Date;
}

/**
 * Fetches all playlists belonging to a user.
 */
export async function findByUserId(userId: string): Promise<PlaylistRow[]> {
  const result = await pool.query<PlaylistRow>(
    `SELECT id, user_id, name, created_at, updated_at
     FROM playlists
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

/**
 * Fetches a single playlist by its ID. Returns null when not found.
 */
export async function findById(id: string): Promise<PlaylistRow | null> {
  const result = await pool.query<PlaylistRow>(
    `SELECT id, user_id, name, created_at, updated_at
     FROM playlists
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

/**
 * Creates a new playlist for the given user and returns the created row.
 */
export async function create(userId: string, name: string): Promise<PlaylistRow> {
  const result = await pool.query<PlaylistRow>(
    `INSERT INTO playlists (user_id, name)
     VALUES ($1, $2)
     RETURNING id, user_id, name, created_at, updated_at`,
    [userId, name],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create playlist: no row returned');
  }
  return row;
}

/**
 * Updates the name of a playlist. Returns the updated row, or null if not found.
 */
export async function update(id: string, name: string): Promise<PlaylistRow | null> {
  const result = await pool.query<PlaylistRow>(
    `UPDATE playlists
     SET name = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, name, created_at, updated_at`,
    [id, name],
  );
  return result.rows[0] ?? null;
}

/**
 * Deletes a playlist by ID.
 */
export async function deletePlaylist(id: string): Promise<void> {
  await pool.query(`DELETE FROM playlists WHERE id = $1`, [id]);
}

/**
 * Returns the number of items in a playlist.
 */
export async function countItems(playlistId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM playlist_items WHERE playlist_id = $1`,
    [playlistId],
  );
  const row = result.rows[0];
  return row ? parseInt(row.count, 10) : 0;
}

/**
 * Returns all items in a playlist ordered by position ascending.
 */
export async function findItems(playlistId: string): Promise<PlaylistItemRow[]> {
  const result = await pool.query<PlaylistItemRow>(
    `SELECT id, playlist_id, video_id, title, channel_name, duration_sec,
            thumbnail_url, position, added_at
     FROM playlist_items
     WHERE playlist_id = $1
     ORDER BY position ASC`,
    [playlistId],
  );
  return result.rows;
}

/**
 * Adds an item to a playlist.
 * On conflict (playlist_id, video_id) does nothing and returns the existing row.
 */
export async function addItem(
  playlistId: string,
  item: Omit<PlaylistItemRow, 'id' | 'playlist_id' | 'added_at'>,
): Promise<PlaylistItemRow> {
  const result = await pool.query<PlaylistItemRow>(
    `INSERT INTO playlist_items
       (playlist_id, video_id, title, channel_name, duration_sec, thumbnail_url, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (playlist_id, video_id) DO NOTHING
     RETURNING id, playlist_id, video_id, title, channel_name, duration_sec,
               thumbnail_url, position, added_at`,
    [
      playlistId,
      item.video_id,
      item.title,
      item.channel_name,
      item.duration_sec,
      item.thumbnail_url,
      item.position,
    ],
  );

  if (result.rows[0]) {
    return result.rows[0];
  }

  // Row already existed (ON CONFLICT DO NOTHING returned nothing) — fetch existing
  const existing = await pool.query<PlaylistItemRow>(
    `SELECT id, playlist_id, video_id, title, channel_name, duration_sec,
            thumbnail_url, position, added_at
     FROM playlist_items
     WHERE playlist_id = $1 AND video_id = $2`,
    [playlistId, item.video_id],
  );

  const row = existing.rows[0];
  if (!row) {
    throw new Error('Failed to add playlist item: no row found after conflict');
  }
  return row;
}

/**
 * Removes a specific item from a playlist.
 */
export async function removeItem(playlistId: string, itemId: string): Promise<void> {
  await pool.query(
    `DELETE FROM playlist_items WHERE playlist_id = $1 AND id = $2`,
    [playlistId, itemId],
  );
}

/**
 * Updates the position of each item according to the provided ordered array of IDs.
 * Uses a single UPDATE … FROM (VALUES …) statement for efficiency.
 */
export async function reorderItems(
  playlistId: string,
  orderedItemIds: string[],
): Promise<void> {
  if (orderedItemIds.length === 0) return;

  // Build parameterised values: ($2, 1), ($3, 2), …
  const values = orderedItemIds
    .map((_, idx) => `($${idx + 2}::uuid, ${idx + 1})`)
    .join(', ');

  await pool.query(
    `UPDATE playlist_items AS pi
     SET position = v.position
     FROM (VALUES ${values}) AS v(id, position)
     WHERE pi.id = v.id AND pi.playlist_id = $1`,
    [playlistId, ...orderedItemIds],
  );
}
