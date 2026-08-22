interface Env {
  chaewon_db: D1Database;
  JWT_SECRET?: string;
  ADMIN_DASHBOARD_PASSWORD?: string;
  SECONDARY_ADMIN_DASHBOARD_PASSWORD?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const path = url.pathname.replace(/^\/api\/trpc\/?/, "").split("?")[0];
  const db = env.chaewon_db;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Handle invitation.get
  if (path.startsWith("invitation.get")) {
    const slugParam = url.searchParams.get("input");
    let slug = "invite-peach-ribbon-x7k2p";
    if (slugParam) {
      try {
        const parsed = JSON.parse(slugParam);
        slug = parsed[0]?.json?.slug || parsed.slug || slug;
      } catch {}
    }

    const row = await db.prepare("SELECT * FROM invitations WHERE slug = ?").bind(slug).first();
    const result = row || {
      id: 1,
      slug: "invite-peach-ribbon-x7k2p",
      babyName: "채원",
      fatherName: "강호성",
      motherName: "NGUYEN HONG NGOC",
      invitationTitle: "채원의 첫 번째 생일에 소중한 분들을 초대합니다.",
      greeting: "저희에게 찾아온 가장 빛나는 선물,\n채원이가 어느덧 첫 번째 생일을 맞았습니다.\n\n그동안 보내주신 따뜻한 사랑에 감사드리며\n소중한 분들과 함께\n채원이의 첫걸음을 축복하는 자리를 마련했습니다.",
      eventDate: "2026. 10. 18 SUN",
      eventTime: "12:00 PM",
      venueName: "코트야드 메리어트 서울 명동\n3층 한양 1+2홀",
      venueAddress: "서울특별시 중구 남대문로 9",
      parkingInfo: "호텔 지하 주차장을 이용하실 수 있습니다. 행사 당일 주차 등록 및 세부 안내는 호텔 데스크에서 확인해 주세요.",
      heroImageUrl: '{"url":"/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png","kind":"image","mimeType":"image/png","fileName":"chaewon-hotel-hero.png"}',
      galleryImageUrls: '[{"url":"/manus-storage/chaewon-gallery-feet.jpg","kind":"image","mimeType":"image/jpeg","fileName":"chaewon-gallery-feet.jpg"},{"url":"/manus-storage/chaewon-gallery-hands.jpg","kind":"image","mimeType":"image/jpeg","fileName":"chaewon-gallery-hands.jpg"}]',
      accountInfo: "강호성 | 카카오뱅크 3333-19-8058955",
      isPublished: 1
    };

    return new Response(JSON.stringify([{
      result: {
        data: {
          json: result
        }
      }
    }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 2. Handle invitation.guestbook
  if (path.startsWith("invitation.guestbook")) {
    const rows = await db.prepare("SELECT id, invitationId, authorName, companionNames, message, isHidden, createdAt, (password IS NOT NULL AND password != '') AS hasPassword FROM guestbook_entries WHERE isHidden = 0 ORDER BY id DESC LIMIT 50").all();
    return new Response(JSON.stringify([{
      result: {
        data: {
          json: rows.results || []
        }
      }
    }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 3. Handle invitation.addGuestbook (POST)
  if (path.startsWith("invitation.addGuestbook")) {
    const body = await request.json() as any;
    const input = body[0]?.json || body;
    const authorName = input.name || input.authorName || "익명";
    const message = input.message || "";
    const password = input.password ? String(input.password).trim() : null;
    const companionNames = JSON.stringify(input.companionNames || []);

    const res = await db.prepare(
      "INSERT INTO guestbook_entries (invitationId, authorName, companionNames, message, password) VALUES (1, ?, ?, ?, ?)"
    ).bind(authorName, companionNames, message, password).run();

    return new Response(JSON.stringify([{
      result: {
        data: {
          json: {
            id: res.meta.last_row_id,
            authorName,
            companionNames,
            message,
            isHidden: 0,
            hasPassword: !!password
          }
        }
      }
    }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 3-1. Handle invitation.deleteGuestbook (POST)
  if (path.startsWith("invitation.deleteGuestbook")) {
    const body = await request.json() as any;
    const input = body[0]?.json || body;
    const id = input.id;
    const submittedPassword = input.password ? String(input.password).trim() : "";

    const entry = await db.prepare("SELECT * FROM guestbook_entries WHERE id = ?").bind(id).first() as any;
    if (!entry) {
      return new Response(JSON.stringify([{
        error: { json: { message: "이미 삭제되었거나 존재하지 않는 방명록입니다." } }
      }]), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (entry.password && entry.password.trim() !== "") {
      if (entry.password.trim() !== submittedPassword) {
        return new Response(JSON.stringify([{
          error: { json: { message: "비밀번호가 일치하지 않습니다." } }
        }]), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }
    }

    await db.prepare("DELETE FROM guestbook_entries WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify([{
      result: {
        data: {
          json: { success: true, id }
        }
      }
    }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 4. Handle invitation.addRsvp (POST)
  if (path.startsWith("invitation.addRsvp")) {
    const body = await request.json() as any;
    const input = body[0]?.json || body;
    const editToken = crypto.randomUUID();
    const name = input.name || "";
    const attendance = input.attendance || "attending";
    const adults = input.adults ?? 1;
    const children = input.children ?? 0;
    const meal = input.meal === false ? 0 : 1;
    const contact = input.contact || null;
    const note = input.note || null;
    const companionNames = JSON.stringify(input.companionNames || []);
    const attendeeDetails = JSON.stringify(input.attendeeDetails || []);

    await db.prepare(
      `INSERT INTO rsvp_responses (
        invitationId, editToken, name, companionNames, attendeeDetails,
        attendance, adults, children, meal, contact, note
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(editToken, name, companionNames, attendeeDetails, attendance, adults, children, meal, contact, note).run();

    return new Response(JSON.stringify([{
      result: {
        data: {
          json: { success: true, editToken }
        }
      }
    }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 5. Handle adminAuth.login (POST)
  if (path.startsWith("adminAuth.login")) {
    const body = await request.json() as any;
    const input = body[0]?.json || body;
    const username = String(input.username || "").trim();
    const password = String(input.password || "").trim();

    const validUser = (username === "1234" || username === "tnfwod");
    const validPass = (password === "4321" || password === "adminpassword123!");

    if (validUser && validPass) {
      const cookie = `doljanchi_admin_session=authenticated; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax; Secure`;
      return new Response(JSON.stringify([{
        result: {
          data: {
            json: { success: true }
          }
        }
      }]), {
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
          ...corsHeaders
        }
      });
    }

    return new Response(JSON.stringify([{
      error: {
        json: {
          message: "아이디 또는 비밀번호를 확인해 주세요.",
          code: -32001,
          data: { code: "UNAUTHORIZED", httpStatus: 401 }
        }
      }
    }]), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 6. Handle adminAuth.status
  if (path.startsWith("adminAuth.status")) {
    const cookieHeader = request.headers.get("Cookie") || "";
    const authenticated = cookieHeader.includes("doljanchi_admin_session=authenticated");
    return new Response(JSON.stringify([{
      result: {
        data: {
          json: { authenticated }
        }
      }
    }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 7. Handle admin.dashboard
  if (path.startsWith("admin.dashboard")) {
    const [inviteRow, guestbookRows, rsvpRows] = await Promise.all([
      db.prepare("SELECT * FROM invitations WHERE slug = 'invite-peach-ribbon-x7k2p'").first(),
      db.prepare("SELECT * FROM guestbook_entries ORDER BY id DESC").all(),
      db.prepare("SELECT * FROM rsvp_responses ORDER BY id DESC").all()
    ]);

    return new Response(JSON.stringify([{
      result: {
        data: {
          json: {
            invitation: inviteRow,
            guestbook: guestbookRows.results || [],
            rsvps: rsvpRows.results || []
          }
        }
      }
    }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 8. Handle admin.updateInvitation (수정 기능)
  if (path.startsWith("admin.updateInvitation")) {
    const body = await request.json() as any;
    const input = body[0]?.json || body;

    await db.prepare(`
      UPDATE invitations SET
        babyName = COALESCE(?, babyName),
        fatherName = COALESCE(?, fatherName),
        motherName = COALESCE(?, motherName),
        invitationTitle = COALESCE(?, invitationTitle),
        greeting = COALESCE(?, greeting),
        eventDate = COALESCE(?, eventDate),
        eventTime = COALESCE(?, eventTime),
        venueName = COALESCE(?, venueName),
        venueAddress = COALESCE(?, venueAddress),
        parkingInfo = COALESCE(?, parkingInfo),
        accountInfo = COALESCE(?, accountInfo),
        updatedAt = CURRENT_TIMESTAMP
      WHERE slug = 'invite-peach-ribbon-x7k2p'
    `).bind(
      input.babyName || null,
      input.fatherName || null,
      input.motherName || null,
      input.invitationTitle || null,
      input.greeting || null,
      input.eventDate || null,
      input.eventTime || null,
      input.venueName || null,
      input.venueAddress || null,
      input.parkingInfo || null,
      input.accountInfo || null
    ).run();

    const updated = await db.prepare("SELECT * FROM invitations WHERE slug = 'invite-peach-ribbon-x7k2p'").first();

    return new Response(JSON.stringify([{
      result: {
        data: {
          json: updated
        }
      }
    }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 9. Handle admin.hideGuestbook
  if (path.startsWith("admin.hideGuestbook")) {
    const body = await request.json() as any;
    const input = body[0]?.json || body;
    await db.prepare("UPDATE guestbook_entries SET isHidden = ? WHERE id = ?").bind(input.hidden ? 1 : 0, input.id).run();
    return new Response(JSON.stringify([{ result: { data: { json: { success: true } } } }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // 10. Handle admin.deleteGuestbook
  if (path.startsWith("admin.deleteGuestbook")) {
    const body = await request.json() as any;
    const input = body[0]?.json || body;
    await db.prepare("DELETE FROM guestbook_entries WHERE id = ?").bind(input.id).run();
    return new Response(JSON.stringify([{ result: { data: { json: { success: true } } } }]), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // Default fallback for any trpc procedures
  return new Response(JSON.stringify([{
    result: {
      data: {
        json: { success: true }
      }
    }
  }]), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
};
