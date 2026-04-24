import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { ApplicationStatus } from '../../types/resume';
import { StatusPill, STATUS_LABELS, ALL_STATUSES } from './StatusPill';
import { daysSince } from '../../utils/applicationStats';
import { generateId } from '../../utils/id';

interface Props {
  applicationId: string | null;
  onClose: () => void;
  onOpenResume: (resumeId: string) => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ApplicationDetailDrawer({ applicationId, onClose, onOpenResume }: Props) {
  const application = useAppStore((s) =>
    applicationId ? s.applications.find((a) => a.id === applicationId) ?? null : null,
  );
  const jobDescriptions = useAppStore((s) => s.jobDescriptions);
  const updateApplication = useAppStore((s) => s.updateApplication);
  const addApplicationEvent = useAppStore((s) => s.addApplicationEvent);
  const removeApplication = useAppStore((s) => s.removeApplication);

  const [companyLocal, setCompanyLocal] = useState('');
  const [roleLocal, setRoleLocal] = useState('');
  const [notesLocal, setNotesLocal] = useState('');
  const [showLogForm, setShowLogForm] = useState(false);
  const [logStatus, setLogStatus] = useState<ApplicationStatus>('applied');
  const [logNote, setLogNote] = useState('');
  const [markingApplied, setMarkingApplied] = useState(false);

  // Auto-close if the app disappears (e.g., cascade delete).
  useEffect(() => {
    if (applicationId && !application) onClose();
  }, [applicationId, application, onClose]);

  // Sync local fields when a new application is shown.
  useEffect(() => {
    if (application) {
      setCompanyLocal(application.company);
      setRoleLocal(application.role);
      setNotesLocal(application.notes ?? '');
      setMarkingApplied(false);
      setShowLogForm(false);
      setLogNote('');
    }
  }, [application?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!applicationId || !application) return null;

  const jdExists = jobDescriptions.some((j) => j.id === application.jobDescriptionId);

  function markApplied() {
    if (!application || markingApplied) return;
    setMarkingApplied(true);
    addApplicationEvent(application.id, {
      id: generateId(),
      status: 'applied',
      date: new Date().toISOString(),
    });
  }

  function submitLogEvent() {
    if (!application) return;
    addApplicationEvent(application.id, {
      id: generateId(),
      status: logStatus,
      date: new Date().toISOString(),
      note: logNote.trim() || undefined,
    });
    setShowLogForm(false);
    setLogNote('');
  }

  function confirmDelete() {
    if (!application) return;
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    removeApplication(application.id);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-white border-l border-stone-200 z-50 flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-stone-200 flex-shrink-0">
          <h3 className="text-sm font-medium text-stone-800">Application</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Company/role/status */}
          <div>
            <input
              aria-label="Company"
              value={companyLocal}
              onChange={(e) => setCompanyLocal(e.target.value)}
              onBlur={() => {
                if (companyLocal !== application.company) {
                  updateApplication(application.id, { company: companyLocal });
                }
              }}
              className="block w-full font-display font-bold text-xl text-stone-900 bg-transparent focus:outline-none focus:border-b focus:border-blue-600 pb-0.5"
            />
            <input
              aria-label="Role"
              value={roleLocal}
              onChange={(e) => setRoleLocal(e.target.value)}
              onBlur={() => {
                if (roleLocal !== application.role) {
                  updateApplication(application.id, { role: roleLocal });
                }
              }}
              className="mt-1 block w-full text-sm text-stone-700 bg-transparent focus:outline-none focus:border-b focus:border-blue-600 pb-0.5"
            />
            <div className="mt-2">
              <StatusPill status={application.status} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenResume(application.resumeId)}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 border border-stone-200 rounded-md hover:bg-stone-50"
            >
              Open resume
            </button>
            {jdExists ? (
              <button
                type="button"
                onClick={() => {
                  useAppStore.getState().setActiveJobDescriptionId(application.jobDescriptionId);
                }}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 border border-stone-200 rounded-md hover:bg-stone-50"
              >
                View JD
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs text-stone-400 border border-stone-100 rounded-md">
                JD deleted
              </span>
            )}
            {application.status === 'draft' && (
              <button
                type="button"
                onClick={markApplied}
                disabled={markingApplied}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark applied
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowLogForm((v) => !v)}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 border border-stone-200 rounded-md hover:bg-stone-50"
            >
              Log event
            </button>
          </div>

          {/* Log event form */}
          {showLogForm && (
            <div className="border border-stone-200 rounded-md p-3 space-y-2 bg-stone-50">
              <label className="block text-xs font-medium text-stone-700">
                Status
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value as ApplicationStatus)}
                  className="mt-1 block w-full text-sm px-2 py-1 border border-stone-200 rounded-md bg-white"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-stone-700">
                Note (optional)
                <input
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="mt-1 block w-full text-sm px-2 py-1 border border-stone-200 rounded-md"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="px-3 py-1 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitLogEvent}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add event
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500 mb-2">
              Timeline
            </div>
            <ul className="space-y-2">
              {[...application.events].reverse().map((ev) => (
                <li key={ev.id} className="flex items-start gap-2 text-xs">
                  <StatusPill status={ev.status} />
                  <div className="flex-1">
                    <div className="font-mono text-stone-600 tabular-nums">{formatDateTime(ev.date)}</div>
                    {ev.note && <div className="text-stone-600 mt-0.5">{ev.note}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Metadata */}
          <div className="border-t border-stone-200 pt-4 space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
              Details
            </div>
            <MetaField
              label="Job URL"
              value={application.jobUrl ?? ''}
              onSave={(v) => updateApplication(application.id, { jobUrl: v || undefined })}
            />
            <MetaField
              label="Salary"
              value={application.salary ?? ''}
              onSave={(v) => updateApplication(application.id, { salary: v || undefined })}
            />
            <MetaField
              label="Location"
              value={application.location ?? ''}
              onSave={(v) => updateApplication(application.id, { location: v || undefined })}
            />
            <MetaField
              label="Contact"
              value={application.contact ?? ''}
              onSave={(v) => updateApplication(application.id, { contact: v || undefined })}
            />
            <MetaField
              label="Next step date"
              value={application.nextStepDate ?? ''}
              type="date"
              onSave={(v) => updateApplication(application.id, { nextStepDate: v || null })}
            />
          </div>

          {/* Notes */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500 mb-1">
              Notes
            </div>
            <textarea
              value={notesLocal}
              onChange={(e) => setNotesLocal(e.target.value)}
              onBlur={() => {
                if (notesLocal !== (application.notes ?? '')) {
                  updateApplication(application.id, { notes: notesLocal || undefined });
                }
              }}
              rows={4}
              className="w-full text-sm px-2 py-1.5 border border-stone-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="text-[11px] text-stone-400 font-mono tabular-nums">
            Created {formatDateTime(application.createdAt)} · {daysSince(application.createdAt)}d ago
          </div>

          {/* Danger zone */}
          <div className="border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={confirmDelete}
              className="text-xs text-red-600 hover:text-red-700 hover:underline"
            >
              Delete application
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MetaField({
  label,
  value,
  type = 'text',
  onSave,
}: {
  label: string;
  value: string;
  type?: 'text' | 'date';
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <label className="block text-xs">
      <span className="text-stone-500">{label}</span>
      <input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value) onSave(local);
        }}
        className="mt-0.5 block w-full text-sm px-2 py-1 border border-stone-200 rounded-md focus:outline-none focus:border-blue-600"
      />
    </label>
  );
}
