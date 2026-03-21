import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '../../types/resume';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    borderBottom: '1pt solid #d1d5db',
    paddingBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 9,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#374151',
    borderBottom: '0.5pt solid #d1d5db',
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  itemSubtitle: {
    fontSize: 9,
    color: '#6b7280',
  },
  dateText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  bullet: {
    fontSize: 9,
    color: '#374151',
    marginLeft: 12,
    marginBottom: 2,
  },
  text: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
  },
  skillRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  skillCategory: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  skillList: {
    fontSize: 9,
    color: '#374151',
  },
});

interface PdfDocumentProps {
  resume: Resume;
}

export function PdfDocument({ resume }: PdfDocumentProps) {
  const sections = resume.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);
  const contact = sections.find((s) => s.content.type === 'contact');
  const contactData = contact?.content.type === 'contact' ? contact.content.data : null;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        {contactData && (
          <View style={styles.header}>
            <Text style={styles.name}>{contactData.fullName || 'Your Name'}</Text>
            <Text style={styles.contactLine}>
              {[contactData.email, contactData.phone, contactData.location].filter(Boolean).join(' | ')}
            </Text>
            {(contactData.linkedin || contactData.github || contactData.website) && (
              <Text style={styles.contactLine}>
                {[contactData.linkedin, contactData.github, contactData.website].filter(Boolean).join(' | ')}
              </Text>
            )}
          </View>
        )}

        {/* Sections */}
        {sections.filter((s) => s.content.type !== 'contact').map((section) => {
          const { content } = section;

          if (content.type === 'summary' && content.data.text) {
            return (
              <View key={section.id}>
                <Text style={styles.sectionTitle}>Professional Summary</Text>
                <Text style={styles.text}>{content.data.text}</Text>
              </View>
            );
          }

          if (content.type === 'experience' && content.data.items.length > 0) {
            return (
              <View key={section.id}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {content.data.items.map((item) => (
                  <View key={item.id} style={{ marginBottom: 8 }}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{item.title} at {item.company}</Text>
                      <Text style={styles.dateText}>
                        {item.dateRange.start} - {item.dateRange.end ?? 'Present'}
                      </Text>
                    </View>
                    {item.location && <Text style={styles.itemSubtitle}>{item.location}</Text>}
                    {item.bullets.map((b, i) => (
                      <Text key={i} style={styles.bullet}>• {b}</Text>
                    ))}
                  </View>
                ))}
              </View>
            );
          }

          if (content.type === 'education' && content.data.items.length > 0) {
            return (
              <View key={section.id}>
                <Text style={styles.sectionTitle}>Education</Text>
                {content.data.items.map((item) => (
                  <View key={item.id} style={{ marginBottom: 4 }}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{item.degree} in {item.field}</Text>
                      <Text style={styles.dateText}>
                        {item.dateRange.start} - {item.dateRange.end ?? 'Present'}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtitle}>{item.institution}</Text>
                    {item.gpa && <Text style={styles.itemSubtitle}>GPA: {item.gpa}</Text>}
                  </View>
                ))}
              </View>
            );
          }

          if (content.type === 'skills' && content.data.categories.length > 0) {
            return (
              <View key={section.id}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {content.data.categories.map((cat) => (
                  <View key={cat.id} style={styles.skillRow}>
                    <Text style={styles.skillCategory}>{cat.name}: </Text>
                    <Text style={styles.skillList}>{cat.skills.join(', ')}</Text>
                  </View>
                ))}
              </View>
            );
          }

          if (content.type === 'certifications' && content.data.items.length > 0) {
            return (
              <View key={section.id}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {content.data.items.map((item) => (
                  <View key={item.id} style={styles.itemHeader}>
                    <Text style={styles.text}>{item.name} — {item.issuer}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                ))}
              </View>
            );
          }

          if (content.type === 'projects' && content.data.items.length > 0) {
            return (
              <View key={section.id}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {content.data.items.map((item) => (
                  <View key={item.id} style={{ marginBottom: 6 }}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    {item.technologies.length > 0 && (
                      <Text style={styles.itemSubtitle}>({item.technologies.join(', ')})</Text>
                    )}
                    <Text style={styles.text}>{item.description}</Text>
                    {item.bullets.map((b, i) => (
                      <Text key={i} style={styles.bullet}>• {b}</Text>
                    ))}
                  </View>
                ))}
              </View>
            );
          }

          return null;
        })}
      </Page>
    </Document>
  );
}
