import { useState, useEffect, useCallback } from 'react';
import { Heart, Bookmark, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CurationActionBarProps {
  curationId: number;
  className?: string;
}

interface ReportDialogProps {
  curationId: number;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

function ReportDialog({ curationId, onClose, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const { t } = useTranslation();

  const reasons = [
    { value: 'inappropriate', label: t('curationActions.reportReasons.inappropriate', 'Unangemessener Inhalt') },
    { value: 'spam', label: t('curationActions.reportReasons.spam', 'Spam') },
    { value: 'copyright', label: t('curationActions.reportReasons.copyright', 'Urheberrechtsverletzung') },
    { value: 'misleading', label: t('curationActions.reportReasons.misleading', 'Irreführend') },
    { value: 'other', label: t('curationActions.reportReasons.other', 'Sonstiges') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('curationActions.reportTitle', 'Kuration melden')}
        </h3>

        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-gray-700">
            {t('curationActions.reportReasonLabel', 'Grund')}
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            data-testid="select-report-reason"
          >
            <option value="">{t('curationActions.selectReason', 'Grund auswählen...')}</option>
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            {t('curationActions.reportDetails', 'Details (optional)')}
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('curationActions.reportDetailsPlaceholder', 'Beschreibe das Problem genauer...')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            data-testid="input-report-details"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            data-testid="button-cancel-report"
          >
            {t('common.cancel', 'Abbrechen')}
          </button>
          <button
            onClick={() => {
              if (reason) onSubmit(reason, details);
            }}
            disabled={!reason}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="button-submit-report"
          >
            {t('curationActions.submitReport', 'Melden')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CurationActionBar({ curationId, className = '' }: CurationActionBarProps) {
  const { t } = useTranslation();
  const [likes, setLikes] = useState(0);
  const [bookmarks, setBookmarks] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userBookmarked, setUserBookmarked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const fetchInteractions = useCallback(async () => {
    try {
      const res = await fetch(`/api/curations/${curationId}/interactions`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setLikes(data.likes);
        setBookmarks(data.bookmarks);
        setUserLiked(data.userLiked);
        setUserBookmarked(data.userBookmarked);
      }
    } catch {}
  }, [curationId]);

  useEffect(() => {
    if (curationId) fetchInteractions();
  }, [curationId, fetchInteractions]);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/curations/${curationId}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        setUserLiked(data.liked);
        setLikes(data.likes);
      }
    } catch {}
  };

  const handleBookmark = async () => {
    try {
      const res = await fetch(`/api/curations/${curationId}/bookmark`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        setUserBookmarked(data.bookmarked);
        setBookmarks(data.bookmarks);
      }
    } catch {}
  };

  const handleReport = async (reason: string, details: string) => {
    try {
      const res = await fetch('/api/content-reports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'curation',
          contentId: curationId,
          reason,
          details,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setReportSent(true);
        setShowReport(false);
      }
    } catch {}
  };

  if (!curationId) return null;

  return (
    <>
      <div className={`flex items-center justify-center gap-6 py-4 ${className}`} data-testid={`curation-actions-${curationId}`}>
        <button
          onClick={handleLike}
          className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
            userLiked
              ? 'border-red-300 bg-red-50 text-red-600'
              : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-500'
          }`}
          data-testid={`button-like-curation-${curationId}`}
        >
          <Heart className={`w-4 h-4 transition-all ${userLiked ? 'fill-red-500 text-red-500' : 'group-hover:text-red-400'}`} />
          <span>{t('curationActions.like', 'Gefällt mir')}</span>
          {likes > 0 && <span className="text-xs opacity-60">({likes})</span>}
        </button>

        <button
          onClick={handleBookmark}
          className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
            userBookmarked
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:text-amber-600'
          }`}
          data-testid={`button-bookmark-curation-${curationId}`}
        >
          <Bookmark className={`w-4 h-4 transition-all ${userBookmarked ? 'fill-amber-500 text-amber-500' : 'group-hover:text-amber-400'}`} />
          <span>{t('curationActions.bookmark', 'Merken')}</span>
          {bookmarks > 0 && <span className="text-xs opacity-60">({bookmarks})</span>}
        </button>

        <button
          onClick={() => !reportSent && setShowReport(true)}
          disabled={reportSent}
          className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
            reportSent
              ? 'border-green-300 bg-green-50 text-green-600 cursor-default'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800'
          }`}
          data-testid={`button-report-curation-${curationId}`}
        >
          <Flag className={`w-4 h-4 transition-all ${reportSent ? 'text-green-500' : 'group-hover:text-gray-500'}`} />
          <span>{reportSent ? t('curationActions.reported', 'Gemeldet') : t('curationActions.report', 'Melden')}</span>
        </button>
      </div>

      {showReport && (
        <ReportDialog
          curationId={curationId}
          onClose={() => setShowReport(false)}
          onSubmit={handleReport}
        />
      )}
    </>
  );
}
