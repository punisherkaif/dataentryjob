import { Document, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType, Packer, BorderStyle } from 'docx'

export interface PageContent {
  pageOrder: number
  typedText: string
}

export interface GenerateDocxOptions {
  taskTitle: string
  workerName: string
  workerEmail?: string
  pages: PageContent[]
}

/**
 * Compiles worker's typed pages into a clean, professionally formatted Microsoft Word (.docx) document
 */
export async function generateTaskDocx({
  taskTitle,
  workerName,
  workerEmail,
  pages,
}: GenerateDocxOptions): Promise<Buffer> {
  const children: (Paragraph)[] = []

  // Document Title Header
  children.push(
    new Paragraph({
      text: taskTitle,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Worker: ${workerName}${workerEmail ? ` (${workerEmail})` : ''}`,
          color: '555555',
          size: 20, // 10pt
        }),
        new TextRun({
          text: `  •  Compiled on: ${new Date().toLocaleString()}`,
          color: '777777',
          size: 18, // 9pt
        }),
      ],
      spacing: { after: 360 },
    }),
    new Paragraph({
      text: '',
      border: {
        bottom: {
          color: 'CCCCCC',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      spacing: { after: 240 },
    })
  )

  // Sort pages by pageOrder
  const sortedPages = [...pages].sort((a, b) => a.pageOrder - b.pageOrder)

  sortedPages.forEach((page, index) => {
    // Page Header / Heading
    children.push(
      new Paragraph({
        text: `--- Page ${page.pageOrder + 1} ---`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 120 },
      })
    )

    // Split text by lines to preserve paragraphs
    const textLines = page.typedText ? page.typedText.split('\n') : ['']
    textLines.forEach((line) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line || '',
              size: 24, // 12pt
              font: 'Calibri',
            }),
          ],
          spacing: { after: 80 },
        })
      )
    })

    // Insert Page Break between pages (except after the last page)
    if (index < sortedPages.length - 1) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      )
    }
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}
