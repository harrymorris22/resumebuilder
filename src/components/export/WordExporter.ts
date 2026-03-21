import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Packer,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Resume } from '../../types/resume';

export async function exportToWord(resume: Resume) {
  const sections = resume.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);
  const contact = sections.find((s) => s.content.type === 'contact');
  const contactData = contact?.content.type === 'contact' ? contact.content.data : null;

  const children: Paragraph[] = [];

  // Contact header
  if (contactData) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contactData.fullName || 'Your Name',
            bold: true,
            size: 32,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: [contactData.email, contactData.phone, contactData.location].filter(Boolean).join(' | '),
            size: 18,
            color: '666666',
          }),
        ],
        spacing: { after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
      })
    );
  }

  // Other sections
  for (const section of sections) {
    if (section.content.type === 'contact') continue;
    const { content } = section;

    const sectionTitle = (title: string) =>
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 18,
          }),
        ],
        spacing: { before: 240, after: 80 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
      });

    if (content.type === 'summary' && content.data.text) {
      children.push(sectionTitle('Professional Summary'));
      children.push(
        new Paragraph({
          children: [new TextRun({ text: content.data.text, size: 20 })],
        })
      );
    }

    if (content.type === 'experience' && content.data.items.length > 0) {
      children.push(sectionTitle('Experience'));
      for (const item of content.data.items) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${item.title} at ${item.company}`, bold: true, size: 20 }),
              new TextRun({
                text: `  ${item.dateRange.start} - ${item.dateRange.end ?? 'Present'}`,
                size: 16,
                color: '999999',
              }),
            ],
          })
        );
        if (item.location) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: item.location, size: 18, color: '666666' })],
            })
          );
        }
        for (const bullet of item.bullets) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: bullet, size: 20 })],
              bullet: { level: 0 },
            })
          );
        }
      }
    }

    if (content.type === 'education' && content.data.items.length > 0) {
      children.push(sectionTitle('Education'));
      for (const item of content.data.items) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${item.degree} in ${item.field}`, bold: true, size: 20 }),
              new TextRun({
                text: ` — ${item.institution}`,
                size: 20,
                color: '666666',
              }),
            ],
          })
        );
      }
    }

    if (content.type === 'skills' && content.data.categories.length > 0) {
      children.push(sectionTitle('Skills'));
      for (const cat of content.data.categories) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${cat.name}: `, bold: true, size: 20 }),
              new TextRun({ text: cat.skills.join(', '), size: 20 }),
            ],
          })
        );
      }
    }

    if (content.type === 'certifications' && content.data.items.length > 0) {
      children.push(sectionTitle('Certifications'));
      for (const item of content.data.items) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${item.name} — ${item.issuer}`, size: 20 }),
              new TextRun({ text: `  ${item.date}`, size: 16, color: '999999' }),
            ],
          })
        );
      }
    }

    if (content.type === 'projects' && content.data.items.length > 0) {
      children.push(sectionTitle('Projects'));
      for (const item of content.data.items) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: item.name, bold: true, size: 20 }),
              ...(item.technologies.length > 0
                ? [new TextRun({ text: ` (${item.technologies.join(', ')})`, size: 16, color: '666666' })]
                : []),
            ],
          })
        );
        children.push(
          new Paragraph({
            children: [new TextRun({ text: item.description, size: 20 })],
          })
        );
        for (const bullet of item.bullets) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: bullet, size: 20 })],
              bullet: { level: 0 },
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${resume.name.replace(/\s+/g, '_')}.docx`;
  saveAs(blob, fileName);
}
