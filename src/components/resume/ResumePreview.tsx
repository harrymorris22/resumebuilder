import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { ResumeSection, SectionContent } from '../../types/resume';
import { SectionRenderer } from './SectionRenderer';
import { SectionDragHandle } from './SectionDragHandle';
import { ContentBankDrawer } from '../contentBank/ContentBankDrawer';
import { UploadResumeModal } from './UploadResumeModal';
import { ExportMenu } from '../export/ExportMenu';
import { ModernTemplate } from '../templates/modern/ModernTemplate';
import { MinimalTemplate } from '../templates/minimal/MinimalTemplate';
import { CreativeTemplate } from '../templates/creative/CreativeTemplate';

function SortableSection({
  section,
  onUpdate,
}: {
  section: ResumeSection;
  onUpdate: (content: SectionContent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {section.content.type !== 'contact' && (
        <SectionDragHandle id={section.id} listeners={listeners} attributes={attributes} />
      )}
      <SectionRenderer section={section} onUpdate={onUpdate} />
    </div>
  );
}

export function ResumePreview() {
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const updateResume = useAppStore((s) => s.updateResume);
  const activeResume = resumes.find((r) => r.id === activeResumeId);
  const [bankOpen, setBankOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!activeResume) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-400">No resume selected</p>
      </div>
    );
  }

  const contactSection = activeResume.sections.find((s) => s.content.type === 'contact');
  const sortableSections = activeResume.sections
    .filter((s) => s.visible && s.content.type !== 'contact')
    .sort((a, b) => a.order - b.order);

  const handleSectionUpdate = (sectionId: string, content: SectionContent) => {
    const updatedSections = activeResume.sections.map((s) =>
      s.id === sectionId ? { ...s, content } : s
    );
    updateResume({
      ...activeResume,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortableSections.findIndex((s) => s.id === active.id);
    const newIndex = sortableSections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Recompute orders
    const reordered = [...sortableSections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updatedSections = activeResume.sections.map((s) => {
      const newOrder = reordered.findIndex((r) => r.id === s.id);
      if (newOrder !== -1) {
        // offset by 1 since contact is order 0
        return { ...s, order: newOrder + 1 };
      }
      return s;
    });

    updateResume({
      ...activeResume,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="bg-white shadow-lg w-full max-w-[8.5in] min-h-[11in] p-8 text-gray-900" style={{ fontFamily: activeResume.templateId === 'classic' ? 'Georgia, serif' : undefined }}>
          {activeResume.templateId === 'modern' ? (
            <ModernTemplate sections={activeResume.sections} onUpdate={handleSectionUpdate} />
          ) : activeResume.templateId === 'minimal' ? (
            <MinimalTemplate sections={activeResume.sections} onUpdate={handleSectionUpdate} />
          ) : activeResume.templateId === 'creative' ? (
            <CreativeTemplate sections={activeResume.sections} onUpdate={handleSectionUpdate} />
          ) : (
            <>
              {/* Classic template with drag-and-drop */}
              {contactSection && contactSection.visible && (
                <SectionRenderer
                  section={contactSection}
                  onUpdate={(content) => handleSectionUpdate(contactSection.id, content)}
                />
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortableSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortableSections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      onUpdate={(content) => handleSectionUpdate(section.id, content)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 h-10 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBankOpen(true)}
            className="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
          >
            Content Bank
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
          >
            Upload Resume
          </button>
        </div>
        <ExportMenu />
      </div>

      <ContentBankDrawer open={bankOpen} onClose={() => setBankOpen(false)} />
      <UploadResumeModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
