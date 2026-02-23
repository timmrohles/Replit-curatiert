const SESSION_TTL = 48 * 60 * 60 * 1000;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function getReferralContext(): { refCreatorId: string | null; refSessionId: string | null } {
  return {
    refCreatorId: getCookie('ref_creator_id'),
    refSessionId: getCookie('ref_session_id'),
  };
}

export function generateSessionId(): string {
  const { refSessionId } = getReferralContext();
  if (refSessionId) {
    localStorage.setItem('affiliate_session_id', refSessionId);
    localStorage.setItem('affiliate_session_ts', Date.now().toString());
    return refSessionId;
  }

  const stored = localStorage.getItem('affiliate_session_id');
  const storedTs = localStorage.getItem('affiliate_session_ts');
  const now = Date.now();

  if (stored && storedTs && (now - parseInt(storedTs)) < SESSION_TTL) {
    return stored;
  }

  const newId = 'sess_' + Math.random().toString(36).substring(2) + '_' + now.toString(36);
  localStorage.setItem('affiliate_session_id', newId);
  localStorage.setItem('affiliate_session_ts', now.toString());
  return newId;
}

export { getReferralContext };

export interface CurationClickParams {
  curation_id: number;
  curation_owner_creator_id: string;
  book_id: string;
  isbn?: string;
}

export function trackCurationClick(params: CurationClickParams): void {
  const session_id = generateSessionId();

  fetch('/api/track/curation-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id,
      curation_id: params.curation_id,
      curation_owner_creator_id: params.curation_owner_creator_id,
      book_id: params.book_id,
      isbn: params.isbn,
    }),
  }).catch(() => {});
}
