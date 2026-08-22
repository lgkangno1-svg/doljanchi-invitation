import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import "dotenv/config";

/**
 * Migration helper script to import backup JSON into the target MySQL database.
 * Usage:
 *   DATABASE_URL="mysql://..." node scripts/import-backup.mjs <path-to-backup.json>
 */
async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: node scripts/import-backup.mjs <backup-file.json>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(path.resolve(jsonPath), "utf-8");
  const backup = JSON.parse(rawData);

  console.log(`Connecting to database...`);
  const connection = await mysql.createConnection(databaseUrl);

  try {
    const invitation = backup.invitation || backup;
    const slug = invitation.slug || "invite-peach-ribbon-x7k2p";
    const venueName = "코트야드 메리어트 서울 명동\n3층 한양 1+2홀"; // Enforce canonical two-line venue

    console.log(`Importing invitation (${slug})...`);
    await connection.execute(
      `INSERT INTO invitations (
        slug, babyName, fatherName, motherName, invitationTitle, greeting,
        eventDate, eventTime, venueName, venueAddress, parkingInfo,
        heroImageUrl, galleryImageUrls, accountInfo, isPublished
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        babyName = VALUES(babyName),
        fatherName = VALUES(fatherName),
        motherName = VALUES(motherName),
        invitationTitle = VALUES(invitationTitle),
        greeting = VALUES(greeting),
        eventDate = VALUES(eventDate),
        eventTime = VALUES(eventTime),
        venueName = VALUES(venueName),
        venueAddress = VALUES(venueAddress),
        parkingInfo = VALUES(parkingInfo),
        heroImageUrl = VALUES(heroImageUrl),
        galleryImageUrls = VALUES(galleryImageUrls),
        accountInfo = VALUES(accountInfo),
        isPublished = VALUES(isPublished)`,
      [
        slug,
        invitation.babyName || "강채원",
        invitation.fatherName || "",
        invitation.motherName || "",
        invitation.invitationTitle || "채원의 첫 번째 생일에 초대합니다",
        invitation.greeting || "",
        invitation.eventDate || "2026-10-18",
        invitation.eventTime || "12:00 PM",
        venueName,
        invitation.venueAddress || "서울특별시 중구 남대문로 9",
        invitation.parkingInfo || "",
        invitation.heroImageUrl || null,
        invitation.galleryImageUrls ? (typeof invitation.galleryImageUrls === "string" ? invitation.galleryImageUrls : JSON.stringify(invitation.galleryImageUrls)) : null,
        invitation.accountInfo || "",
        invitation.isPublished ?? 1,
      ]
    );

    const [rows] = await connection.execute("SELECT id FROM invitations WHERE slug = ?", [slug]);
    const invitationId = rows[0]?.id;

    if (Array.isArray(backup.guestbook) && backup.guestbook.length > 0) {
      console.log(`Importing ${backup.guestbook.length} guestbook entries...`);
      for (const entry of backup.guestbook) {
        await connection.execute(
          `INSERT INTO guestbook_entries (invitationId, authorName, companionNames, message, isHidden, createdAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            invitationId,
            entry.authorName || entry.name || "익명",
            typeof entry.companionNames === "string" ? entry.companionNames : JSON.stringify(entry.companionNames || []),
            entry.message || "",
            entry.isHidden ? 1 : 0,
            entry.createdAt ? new Date(entry.createdAt) : new Date(),
          ]
        );
      }
    }

    if (Array.isArray(backup.rsvps) && backup.rsvps.length > 0) {
      console.log(`Importing ${backup.rsvps.length} RSVP responses...`);
      for (const rsvp of backup.rsvps) {
        await connection.execute(
          `INSERT INTO rsvp_responses (
            invitationId, editToken, name, companionNames, attendeeDetails,
            attendance, adults, children, meal, contact, note, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            companionNames = VALUES(companionNames),
            attendeeDetails = VALUES(attendeeDetails),
            attendance = VALUES(attendance),
            adults = VALUES(adults),
            children = VALUES(children),
            meal = VALUES(meal),
            contact = VALUES(contact),
            note = VALUES(note)`,
          [
            invitationId,
            rsvp.editToken || crypto.randomUUID(),
            rsvp.name || "",
            typeof rsvp.companionNames === "string" ? rsvp.companionNames : JSON.stringify(rsvp.companionNames || []),
            typeof rsvp.attendeeDetails === "string" ? rsvp.attendeeDetails : JSON.stringify(rsvp.attendeeDetails || []),
            rsvp.attendance || "attending",
            rsvp.adults ?? 1,
            rsvp.children ?? 0,
            rsvp.meal ?? 1,
            rsvp.contact || null,
            rsvp.note || null,
            rsvp.createdAt ? new Date(rsvp.createdAt) : new Date(),
          ]
        );
      }
    }

    console.log("✅ Data migration successfully completed.");
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
