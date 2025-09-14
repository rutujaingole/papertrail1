import { useEffect, useState } from 'react'
import { useAppStore } from './store'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { Sun, Moon } from 'lucide-react'
import './electron.d.ts'

function App() {
  const { theme, toggleTheme } = useAppStore()
  const [activeLeftTab, setActiveLeftTab] = useState('library')
  const [selectedPapers, setSelectedPapers] = useState([])
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I can help you populate content, find citations, or summarize research. Select one or more papers from the library to get contextual assistance based on those research papers. Click papers to select/deselect them. How can I assist with your paper?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [projects, setProjects] = useState([
    { id: 1, name: 'Current Research Paper', template: 'ieee', lastModified: new Date().toLocaleDateString() }
  ])

  // IEEE template sections with editable content
  const [documentContent, setDocumentContent] = useState({
    title: 'Your Research Paper Title',
    authors: 'Author Name¹, Second Author², Third Author¹\n¹University/Institution Name\n²Second Institution Name\n{author1, author3}@institution1.edu, author2@institution2.edu',
    abstract: 'Abstract—This paper presents [your main contribution]. We propose [your method/approach] to address [the problem]. Our experimental results on [dataset/scenario] demonstrate [key findings]. The proposed method achieves [performance metrics] and shows [significant improvements/advantages]. Keywords: keyword1, keyword2, keyword3, keyword4',
    introduction: 'I. INTRODUCTION\n\nThe field of [your research area] has seen significant advances in recent years. However, [problem statement and motivation]. This paper addresses [specific problem] by [your approach].\n\nThe main contributions of this work are:\n• [First contribution]\n• [Second contribution]\n• [Third contribution]\n\nThe remainder of this paper is organized as follows: Section II reviews related work, Section III presents our methodology, Section IV discusses experimental results, and Section V concludes the paper.',
    relatedWork: 'II. RELATED WORK\n\nA. Previous Approaches\n[Review of existing methods and their limitations]\n\nB. Recent Advances\n[Discussion of recent developments in the field]\n\nC. Gap Analysis\n[Identify what is missing in current approaches that your work addresses]',
    methodology: 'III. METHODOLOGY\n\nA. Problem Formulation\n[Mathematical formulation of the problem]\n\nB. Proposed Approach\n[Detailed description of your method]\n\nC. Algorithm Description\n[Step-by-step algorithm or framework]\n\nD. Implementation Details\n[Technical implementation specifics]',
    experiments: 'IV. EXPERIMENTAL RESULTS\n\nA. Experimental Setup\n[Dataset description, evaluation metrics, baseline methods]\n\nB. Results and Analysis\n[Quantitative results with tables and figures]\n\nC. Ablation Study\n[Analysis of different components of your method]\n\nD. Comparison with State-of-the-Art\n[Comparative analysis with existing methods]',
    conclusion: 'V. CONCLUSION\n\nThis paper presented [summary of your work]. The proposed [method/system] demonstrates [key achievements]. Future work includes [potential extensions and improvements].\n\nACKNOWLEDGMENT\n\nThe authors would like to thank [acknowledgments].\n\nREFERENCES\n\n[1] Author, "Title," Conference/Journal, Year.\n[2] Author, "Title," Conference/Journal, Year.'
  })

  const [activeSection, setActiveSection] = useState('abstract')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Electron menu integration
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Menu event listeners
      window.electronAPI.onMenuNewProject(() => {
        createNewProject()
      })

      window.electronAPI.onMenuExportPDF(() => {
        exportToPDF()
      })

      window.electronAPI.onMenuExportWord(() => {
        exportToWord()
      })

      window.electronAPI.onMenuSaveProject((event, filePath) => {
        saveProject(filePath)
      })

      window.electronAPI.onMenuOpenProject((event, filePath) => {
        loadProject(filePath)
      })

      window.electronAPI.onMenuImportPDF((event, filePaths) => {
        handlePDFImport(filePaths)
      })
    }
  }, [])

  const handleSectionEdit = (section, content) => {
    setDocumentContent(prev => ({
      ...prev,
      [section]: content
    }))
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev,
      { role: 'user', content: userMessage }
    ])

    // Simulate AI response after delay
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I understand you're asking about "${userMessage}". I can help you with research content, citations, or summaries. Try using the Populate, Cite, or Summary buttons for specific actions on your current section.`
      }])
    }, 1000)

    setChatInput('')
  }

  const handlePopulate = () => {
    const currentSection = activeSection
    let newContent = documentContent[currentSection]

    if (selectedPapers.length === 0) {
      // Generic population without selected papers
      if (currentSection === 'abstract') {
        newContent += '\n\n[AI Populated] This work introduces novel techniques that significantly improve performance by 15-20% compared to existing methods.'
      } else if (currentSection === 'introduction') {
        newContent += '\n\n[AI Populated] Recent studies have shown the importance of this research direction, with applications in multiple domains including computer vision, natural language processing, and robotics.'
      } else {
        newContent += `\n\n[AI Populated] Additional content for ${currentSection} section based on current research trends and methodologies.`
      }
    } else if (selectedPapers.length === 1) {
      // Single paper population
      const paper = selectedPapers[0]
      if (currentSection === 'abstract') {
        newContent += `\n\n[AI Populated from "${paper.title}"] Building upon the ${paper.methodology}, our approach extends ${paper.keyContributions[0].toLowerCase()} to address similar challenges in our domain.`
      } else if (currentSection === 'introduction') {
        newContent += `\n\n[AI Populated from "${paper.title}"] The seminal work by ${paper.authors.split(',')[0]} et al. (${paper.year}) demonstrated that ${paper.keyContributions[0].toLowerCase()}. This breakthrough has inspired our current investigation into related methodologies.`
      } else if (currentSection === 'relatedWork') {
        newContent += `\n\n[AI Populated from "${paper.title}"] ${paper.authors.split(',')[0]} et al. (${paper.year}) proposed ${paper.title}, which achieved ${paper.results}. Their approach of ${paper.methodology} has become a foundational technique in the field.`
      } else {
        newContent += `\n\n[AI Populated from "${paper.title}"] Following the approach established by ${paper.authors.split(',')[0]} et al. (${paper.year}), we implement similar techniques to achieve comparable results in our experimental setup.`
      }
    } else {
      // Multiple papers population
      if (currentSection === 'abstract') {
        const methods = selectedPapers.map(p => p.methodology.split(',')[0]).join(' and ')
        newContent += `\n\n[AI Populated from ${selectedPapers.length} papers] Building upon recent advances in ${methods}, our approach synthesizes insights from multiple groundbreaking works to address complex challenges in our domain.`
      } else if (currentSection === 'introduction') {
        const citations = selectedPapers.map(p => `${p.authors.split(',')[0]} et al. (${p.year})`).join(', ')
        newContent += `\n\n[AI Populated from ${selectedPapers.length} papers] Recent breakthrough works by ${citations} have collectively advanced our understanding of the field. These complementary approaches have inspired our current investigation.`
      } else if (currentSection === 'relatedWork') {
        const paperSummary = selectedPapers.slice(0, 2).map(p => `${p.authors.split(',')[0]} et al. (${p.year}) achieved ${p.results}`).join('. ')
        newContent += `\n\n[AI Populated from ${selectedPapers.length} papers] Several significant contributions have shaped the current landscape: ${paperSummary}. These works establish the foundation for our proposed methodology.`
      } else {
        newContent += `\n\n[AI Populated from ${selectedPapers.length} papers] Drawing from multiple research directions established by ${selectedPapers.map(p => p.authors.split(',')[0] + ' et al.').join(', ')}, we implement a comprehensive approach that leverages their collective insights.`
      }
    }

    handleSectionEdit(currentSection, newContent)

    const paperReference = selectedPapers.length > 0 ? ` using insights from ${selectedPapers.length} selected paper${selectedPapers.length > 1 ? 's' : ''}` : ''
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: `I've populated additional content for the ${currentSection} section${paperReference}. The content synthesizes information from your selected papers and has been added to your editor.`
    }])
  }

  const handleCite = () => {
    if (selectedPapers.length === 0) {
      const citation = ' [1]'
      const newContent = documentContent[activeSection] + citation
      handleSectionEdit(activeSection, newContent)

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've added a generic citation [1] to the ${activeSection} section. Select papers from the library for more specific citations.`
      }])
    } else if (selectedPapers.length === 1) {
      // Single paper citation
      const paper = selectedPapers[0]
      const citation = ` [${paper.id}]`
      const newContent = documentContent[activeSection] + citation
      handleSectionEdit(activeSection, newContent)

      // Add/update the reference in the conclusion section
      let conclusionContent = documentContent.conclusion
      const referenceEntry = `[${paper.id}] ${paper.authors}, "${paper.title}," ${paper.venue}, ${paper.year}.`

      if (!conclusionContent.includes(`[${paper.id}]`)) {
        if (conclusionContent.includes('REFERENCES')) {
          conclusionContent = conclusionContent.replace(
            'REFERENCES\n\n[1] Author, "Title," Conference/Journal, Year.\n[2] Author, "Title," Conference/Journal, Year.',
            `REFERENCES\n\n${referenceEntry}\n[1] Author, "Title," Conference/Journal, Year.\n[2] Author, "Title," Conference/Journal, Year.`
          )
        } else {
          conclusionContent += `\n\nREFERENCES\n\n${referenceEntry}`
        }
        handleSectionEdit('conclusion', conclusionContent)
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've added a citation [${paper.id}] for "${paper.title}" to the ${activeSection} section and added the full reference to your References section.`
      }])
    } else {
      // Multiple papers citation
      const citations = selectedPapers.map(p => `[${p.id}]`).join(', ')
      const newContent = documentContent[activeSection] + ` ${citations}`
      handleSectionEdit(activeSection, newContent)

      // Add all references
      let conclusionContent = documentContent.conclusion
      const newReferences = []

      selectedPapers.forEach(paper => {
        const referenceEntry = `[${paper.id}] ${paper.authors}, "${paper.title}," ${paper.venue}, ${paper.year}.`
        if (!conclusionContent.includes(`[${paper.id}]`)) {
          newReferences.push(referenceEntry)
        }
      })

      if (newReferences.length > 0) {
        if (conclusionContent.includes('REFERENCES')) {
          const referencesToAdd = newReferences.join('\n')
          conclusionContent = conclusionContent.replace(
            'REFERENCES\n\n[1] Author, "Title," Conference/Journal, Year.\n[2] Author, "Title," Conference/Journal, Year.',
            `REFERENCES\n\n${referencesToAdd}\n[1] Author, "Title," Conference/Journal, Year.\n[2] Author, "Title," Conference/Journal, Year.`
          )
        } else {
          conclusionContent += `\n\nREFERENCES\n\n${newReferences.join('\n')}`
        }
        handleSectionEdit('conclusion', conclusionContent)
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've added citations ${citations} for the ${selectedPapers.length} selected papers to the ${activeSection} section and added all references to your References section.`
      }])
    }
  }

  const handleSummarize = () => {
    const sectionContent = documentContent[activeSection]
    const wordCount = sectionContent.split(' ').length

    let summaryContent = `Summary of ${activeSection} section:\n\n• Word count: ${wordCount} words\n• Content focuses on: ${activeSection === 'abstract' ? 'research overview and key contributions' : activeSection === 'introduction' ? 'problem motivation and paper structure' : 'detailed technical content'}\n• Status: ${wordCount > 50 ? 'Well-developed' : 'Needs more content'}`

    if (selectedPapers.length === 0) {
      summaryContent += `\n\n💡 Tip: Select papers from the library to get contextual insights and smart citations for this section.`
    } else if (selectedPapers.length === 1) {
      const paper = selectedPapers[0]
      summaryContent += `\n\n📋 Selected Paper Context:\n• Paper: "${paper.title}"\n• Authors: ${paper.authors.split(',')[0]} et al. (${paper.year})\n• Key Contributions: ${paper.keyContributions.slice(0, 2).join(', ')}\n• Methodology: ${paper.methodology}\n\n💡 Suggested Integration:\n• Consider referencing their ${paper.keyContributions[0].toLowerCase()}\n• Compare your methodology with their ${paper.methodology.split(',')[0]}\n• Cite when discussing related approaches in ${paper.venue} ${paper.year}`
    } else {
      const paperTitles = selectedPapers.map(p => `"${p.title}"`).join(', ')
      const years = selectedPapers.map(p => p.year).join(', ')
      const methodologies = [...new Set(selectedPapers.map(p => p.methodology.split(',')[0]))].join(', ')

      summaryContent += `\n\n📋 Multiple Papers Context (${selectedPapers.length} selected):\n• Papers: ${paperTitles}\n• Years: ${years}\n• Combined Methodologies: ${methodologies}\n\n💡 Multi-Paper Integration Strategy:\n• Synthesize approaches from multiple sources\n• Compare and contrast different methodologies\n• Cite complementary works to build stronger arguments\n• Use [${selectedPapers.map(p => p.id).join('], [')}] for comprehensive citations`

      // Add individual paper summaries
      selectedPapers.slice(0, 3).forEach((paper, index) => {
        summaryContent += `\n\nPaper ${index + 1}: ${paper.authors.split(',')[0]} et al. (${paper.year})\n• Focus: ${paper.keyContributions[0]}\n• Method: ${paper.methodology.split(',')[0]}`
      })

      if (selectedPapers.length > 3) {
        summaryContent += `\n\n... and ${selectedPapers.length - 3} more paper${selectedPapers.length - 3 > 1 ? 's' : ''}`
      }
    }

    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: summaryContent
    }])
  }

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4')
    doc.setFont('times', 'normal')

    // IEEE column specifications
    const pageWidth = 595.28
    const pageHeight = 841.89
    const leftMargin = 54
    const rightMargin = 54
    const topMargin = 54
    const bottomMargin = 72
    const columnWidth = (pageWidth - leftMargin - rightMargin - 18) / 2 // 18pt gap between columns
    const columnGap = 18

    let leftY = topMargin
    let rightY = topMargin
    let currentColumn = 'left'

    const addText = (text, fontSize, isBold = false, isCenter = false) => {
      doc.setFontSize(fontSize)
      doc.setFont('times', isBold ? 'bold' : 'normal')

      const textWidth = isCenter ? (pageWidth - leftMargin - rightMargin) : columnWidth
      const lines = doc.splitTextToSize(text, textWidth)

      lines.forEach((line, index) => {
        if (isCenter) {
          // Center across full page width for title/authors
          doc.text(line, pageWidth / 2, leftY, { align: 'center' })
          leftY += fontSize * 1.2
        } else {
          // Two-column layout for content
          const x = currentColumn === 'left' ? leftMargin : leftMargin + columnWidth + columnGap
          const currentY = currentColumn === 'left' ? leftY : rightY

          if (currentY + fontSize * 1.2 > pageHeight - bottomMargin) {
            if (currentColumn === 'left') {
              currentColumn = 'right'
            } else {
              doc.addPage()
              leftY = topMargin
              rightY = topMargin
              currentColumn = 'left'
            }
            const newX = currentColumn === 'left' ? leftMargin : leftMargin + columnWidth + columnGap
            doc.text(line, newX, currentColumn === 'left' ? leftY : rightY)
            if (currentColumn === 'left') leftY += fontSize * 1.2
            else rightY += fontSize * 1.2
          } else {
            doc.text(line, x, currentY)
            if (currentColumn === 'left') leftY += fontSize * 1.2
            else rightY += fontSize * 1.2
          }
        }
      })

      if (isCenter) {
        rightY = leftY // Keep columns synchronized after centered content
      }
    }

    // Title (centered, 14pt, bold)
    addText(documentContent.title, 14, true, true)
    leftY += 12
    rightY = leftY

    // Authors (centered, 10pt)
    const cleanAuthors = documentContent.authors.replace(/\n/g, ' ')
    addText(cleanAuthors, 10, false, true)
    leftY += 18
    rightY = leftY

    // Abstract (9pt)
    addText('Abstract—' + documentContent.abstract.replace('Abstract—', ''), 9, false, false)

    // Add some space after abstract
    if (currentColumn === 'left') leftY += 12
    else rightY += 12

    // Content sections
    const sections = [
      documentContent.introduction,
      documentContent.relatedWork,
      documentContent.methodology,
      documentContent.experiments,
      documentContent.conclusion
    ]

    sections.forEach((content) => {
      const lines = content.split('\n')

      lines.forEach((line) => {
        if (!line.trim()) {
          // Empty line - add small space
          if (currentColumn === 'left') leftY += 6
          else rightY += 6
        } else if (line.match(/^[IVX]+\.\s/) || line.includes('ACKNOWLEDGMENT') || line.includes('REFERENCES')) {
          // Main section headers (10pt, bold)
          addText(line, 10, true, false)
        } else if (line.match(/^[A-Z]\.\s/)) {
          // Subsection headers (9pt, bold)
          addText(line, 9, true, false)
        } else {
          // Regular text (9pt)
          addText(line, 9, false, false)
        }
      })
    })

    doc.save(`${documentContent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ieee.pdf`)
  }

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 720,  // 0.5 inch
              bottom: 720, // 0.5 inch
              left: 720,   // 0.5 inch
            },
          },
          column: {
            space: 432,    // 0.3 inch gap
            count: 2,      // Two columns
          },
        },
        children: [
          // Title (centered, 14pt, bold)
          new Paragraph({
            children: [
              new TextRun({
                text: documentContent.title,
                bold: true,
                size: 28, // 14pt
                font: 'Times New Roman',
              }),
            ],
            alignment: 'center',
            spacing: { after: 240 },
          }),

          // Authors (centered, 10pt)
          new Paragraph({
            children: [
              new TextRun({
                text: documentContent.authors.replace(/\n/g, ' '),
                size: 20, // 10pt
                font: 'Times New Roman',
              }),
            ],
            alignment: 'center',
            spacing: { after: 360 },
          }),

          // Abstract (9pt, justified)
          new Paragraph({
            children: [
              new TextRun({
                text: 'Abstract—',
                bold: true,
                size: 18, // 9pt
                font: 'Times New Roman',
              }),
              new TextRun({
                text: documentContent.abstract.replace('Abstract—', ''),
                size: 18, // 9pt
                font: 'Times New Roman',
              }),
            ],
            alignment: 'both',
            spacing: { after: 240 },
          }),

          // Content sections
          ...Object.entries({
            introduction: documentContent.introduction,
            relatedWork: documentContent.relatedWork,
            methodology: documentContent.methodology,
            experiments: documentContent.experiments,
            conclusion: documentContent.conclusion
          }).map(([key, content]) => {
            const lines = content.split('\n').filter(line => line.trim())

            return lines.map(line => {
              if (line.match(/^[IVX]+\.\s/) || line.includes('ACKNOWLEDGMENT') || line.includes('REFERENCES')) {
                // Main section headers (10pt, bold, uppercase)
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: line.toUpperCase(),
                      bold: true,
                      size: 20, // 10pt
                      font: 'Times New Roman',
                    }),
                  ],
                  spacing: { before: 120, after: 120 },
                  alignment: 'both',
                })
              } else if (line.match(/^[A-Z]\.\s/)) {
                // Subsection headers (9pt, bold, italic)
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      bold: true,
                      italics: true,
                      size: 18, // 9pt
                      font: 'Times New Roman',
                    }),
                  ],
                  spacing: { before: 120, after: 60 },
                  alignment: 'both',
                })
              } else if (line.trim()) {
                // Regular text (9pt, justified)
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      size: 18, // 9pt
                      font: 'Times New Roman',
                    }),
                  ],
                  alignment: 'both',
                  spacing: { after: 120 },
                })
              }
              return null
            }).filter(p => p !== null)
          }).flat(),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentContent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ieee.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const createNewProject = () => {
    const newProject = {
      id: projects.length + 1,
      name: `IEEE Paper ${projects.length + 1}`,
      template: 'ieee',
      lastModified: new Date().toLocaleDateString()
    }
    setProjects([...projects, newProject])

    // Reset document content for new project
    setDocumentContent({
      title: 'Your Research Paper Title',
      authors: 'Author Name¹, Second Author², Third Author¹\n¹University/Institution Name\n²Second Institution Name\n{author1, author3}@institution1.edu, author2@institution2.edu',
      abstract: 'Abstract—This paper presents [your main contribution]. We propose [your method/approach] to address [the problem]. Our experimental results on [dataset/scenario] demonstrate [key findings]. The proposed method achieves [performance metrics] and shows [significant improvements/advantages]. Keywords: keyword1, keyword2, keyword3, keyword4',
      introduction: 'I. INTRODUCTION\n\nThe field of [your research area] has seen significant advances in recent years. However, [problem statement and motivation]. This paper addresses [specific problem] by [your approach].\n\nThe main contributions of this work are:\n• [First contribution]\n• [Second contribution]\n• [Third contribution]\n\nThe remainder of this paper is organized as follows: Section II reviews related work, Section III presents our methodology, Section IV discusses experimental results, and Section V concludes the paper.',
      relatedWork: 'II. RELATED WORK\n\nA. Previous Approaches\n[Review of existing methods and their limitations]\n\nB. Recent Advances\n[Discussion of recent developments in the field]\n\nC. Gap Analysis\n[Identify what is missing in current approaches that your work addresses]',
      methodology: 'III. METHODOLOGY\n\nA. Problem Formulation\n[Mathematical formulation of the problem]\n\nB. Proposed Approach\n[Detailed description of your method]\n\nC. Algorithm Description\n[Step-by-step algorithm or framework]\n\nD. Implementation Details\n[Technical implementation specifics]',
      experiments: 'IV. EXPERIMENTAL RESULTS\n\nA. Experimental Setup\n[Dataset description, evaluation metrics, baseline methods]\n\nB. Results and Analysis\n[Quantitative results with tables and figures]\n\nC. Ablation Study\n[Analysis of different components of your method]\n\nD. Comparison with State-of-the-Art\n[Comparative analysis with existing methods]',
      conclusion: 'V. CONCLUSION\n\nThis paper presented [summary of your work]. The proposed [method/system] demonstrates [key achievements]. Future work includes [potential extensions and improvements].\n\nACKNOWLEDGMENT\n\nThe authors would like to thank [acknowledgments].\n\nREFERENCES\n\n[1] Author, "Title," Conference/Journal, Year.\n[2] Author, "Title," Conference/Journal, Year.'
    })
    setActiveSection('abstract')
  }

  const togglePaperSelection = (paper) => {
    const isSelected = selectedPapers.some(p => p.id === paper.id)

    if (isSelected) {
      // Remove paper from selection
      const newSelection = selectedPapers.filter(p => p.id !== paper.id)
      setSelectedPapers(newSelection)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `📚 Removed "${paper.title}" from selection. ${newSelection.length > 0 ? `Still working with ${newSelection.length} paper${newSelection.length > 1 ? 's' : ''}` : 'No papers selected - select papers for contextual assistance'}.`
      }])
    } else {
      // Add paper to selection
      const newSelection = [...selectedPapers, paper]
      setSelectedPapers(newSelection)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `📚 Added "${paper.title}" by ${paper.authors.split(',')[0]} et al. (${paper.year}) to selection. Now working with ${newSelection.length} paper${newSelection.length > 1 ? 's' : ''}: ${newSelection.map(p => p.title).join(', ')}.`
      }])
    }
  }

  const clearAllPapers = () => {
    setSelectedPapers([])
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Cleared all paper selections. Select papers from the library for contextual assistance.'
    }])
  }

  const saveProject = async (filePath = null) => {
    const projectData = {
      name: documentContent.title,
      content: documentContent,
      projects: projects,
      activeSection: activeSection,
      version: '1.0.0',
      savedAt: new Date().toISOString()
    }

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveFile(projectData)
        if (result.success) {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `Project saved successfully to ${result.filePath}`
          }])
        } else {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `Failed to save project: ${result.error || 'Unknown error'}`
          }])
        }
      } catch (error) {
        console.error('Save error:', error)
      }
    }
  }

  const loadProject = async (filePath) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.loadFile(filePath)
        if (result.success) {
          const data = result.data
          setDocumentContent(data.content)
          setProjects(data.projects || projects)
          setActiveSection(data.activeSection || 'abstract')
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `Project loaded successfully from ${filePath}`
          }])
        } else {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `Failed to load project: ${result.error}`
          }])
        }
      } catch (error) {
        console.error('Load error:', error)
      }
    }
  }

  const handlePDFImport = (filePaths) => {
    // For now, just show which files were selected
    // In a real app, you'd parse the PDFs and extract text/references
    const fileNames = filePaths.map(path => path.split(/[\\/]/).pop()).join(', ')
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: `Selected PDF files for import: ${fileNames}. PDF parsing functionality will be implemented in future updates.`
    }])
  }

  const sections = [
    { key: 'abstract', title: 'Abstract' },
    { key: 'introduction', title: 'Introduction' },
    { key: 'relatedWork', title: 'Related Work' },
    { key: 'methodology', title: 'Methodology' },
    { key: 'experiments', title: 'Experiments' },
    { key: 'conclusion', title: 'Conclusion' }
  ]

  const papers = [
    {
      id: 1,
      title: "Attention Is All You Need",
      authors: "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I.",
      year: "2017",
      venue: "NeurIPS",
      impact: "High",
      abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
      keyContributions: [
        "Introduction of the Transformer architecture",
        "Self-attention mechanism for sequence modeling",
        "Elimination of recurrence and convolution layers",
        "State-of-the-art performance on translation tasks"
      ],
      methodology: "Multi-head self-attention, position encoding, encoder-decoder architecture",
      results: "SOTA performance on WMT 2014 English-to-German and English-to-French translation tasks"
    },
    {
      id: 2,
      title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      authors: "Devlin, J., Chang, M. W., Lee, K., & Toutanova, K.",
      year: "2018",
      venue: "NAACL",
      impact: "High",
      abstract: "We introduce BERT, a new method for pre-training language representations which obtains state-of-the-art results on a wide array of natural language processing tasks by jointly conditioning on both left and right context in all layers.",
      keyContributions: [
        "Bidirectional pre-training of Transformers",
        "Masked language modeling objective",
        "Next sentence prediction task",
        "Fine-tuning approach for downstream tasks"
      ],
      methodology: "Masked language modeling, next sentence prediction, bidirectional training",
      results: "New state-of-the-art on 11 NLP tasks including GLUE benchmark"
    },
    {
      id: 3,
      title: "Language Models are Few-Shot Learners",
      authors: "Brown, T., Mann, B., Ryder, N., Subbiah, M., Kaplan, J. D., Dhariwal, P., ... & Amodei, D.",
      year: "2020",
      venue: "NeurIPS",
      impact: "High",
      abstract: "Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task. We show that scaling up language models greatly improves task-agnostic, few-shot performance.",
      keyContributions: [
        "GPT-3 architecture with 175B parameters",
        "Few-shot learning capabilities",
        "In-context learning without parameter updates",
        "Emergent abilities at scale"
      ],
      methodology: "Autoregressive language modeling, in-context learning, prompt engineering",
      results: "Strong few-shot performance across diverse NLP tasks without fine-tuning"
    }
  ]

  // Modern color palette - GitHub/VS Code inspired
  const colors = {
    light: {
      primary: '#ffffff',
      secondary: '#f6f8fa',
      tertiary: '#eaeef2',
      elevated: '#ffffff',
      border: '#d0d7de',
      borderLight: '#eaeef2',
      text: {
        primary: '#1f2328',
        secondary: '#656d76',
        tertiary: '#8c959f'
      },
      accent: {
        primary: '#0969da',
        secondary: '#218bff',
        success: '#1a7f37',
        warning: '#d1242f'
      }
    },
    dark: {
      primary: '#0d1117',
      secondary: '#161b22',
      tertiary: '#21262d',
      elevated: '#161b22',
      border: '#30363d',
      borderLight: '#21262d',
      text: {
        primary: '#f0f6fc',
        secondary: '#9198a1',
        tertiary: '#6e7681'
      },
      accent: {
        primary: '#2f81f7',
        secondary: '#388bfd',
        success: '#3fb950',
        warning: '#da3633'
      }
    }
  }

  const c = colors[theme]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      backgroundColor: c.primary,
      color: c.text.primary,
      fontSize: '14px'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '52px',
        padding: '0 20px',
        borderBottom: `1px solid ${c.border}`,
        backgroundColor: c.elevated,
        boxShadow: theme === 'light' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: c.text.primary
          }}>
            PaperTrail
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Export Buttons */}
          <button
            onClick={exportToPDF}
            style={{
              padding: '8px 12px',
              border: `1px solid ${c.accent.primary}`,
              borderRadius: '6px',
              backgroundColor: c.accent.primary,
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = c.accent.secondary
              e.target.style.borderColor = c.accent.secondary
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = c.accent.primary
              e.target.style.borderColor = c.accent.primary
            }}
          >
            Export PDF
          </button>

          <button
            onClick={exportToWord}
            style={{
              padding: '8px 12px',
              border: `1px solid ${c.border}`,
              borderRadius: '6px',
              backgroundColor: c.secondary,
              color: c.text.primary,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = c.tertiary
              e.target.style.borderColor = c.accent.primary
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = c.secondary
              e.target.style.borderColor = c.border
            }}
          >
            Export Word
          </button>

          <div style={{
            width: '1px',
            height: '24px',
            backgroundColor: c.border,
            margin: '0 4px'
          }}></div>

          <button
            onClick={toggleTheme}
            style={{
              padding: '8px 10px',
              border: `1px solid ${c.border}`,
              borderRadius: '6px',
              backgroundColor: c.secondary,
              cursor: 'pointer',
              fontSize: '16px',
              color: c.text.primary,
              transition: 'all 0.2s ease'
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - Library/Projects */}
        <aside style={{
          width: '320px',
          backgroundColor: c.secondary,
          borderRight: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Left Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: c.elevated,
            borderBottom: `1px solid ${c.border}`
          }}>
            {[
              { id: 'library', label: 'Library' },
              { id: 'projects', label: 'Projects' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLeftTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  borderBottom: activeLeftTab === tab.id ? `2px solid ${c.accent.primary}` : '2px solid transparent',
                  backgroundColor: activeLeftTab === tab.id ? c.primary : 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: activeLeftTab === tab.id ? c.accent.primary : c.text.secondary,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Left Content */}
          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            {activeLeftTab === 'library' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Search papers..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${c.border}`,
                      borderRadius: '8px',
                      backgroundColor: c.primary,
                      color: c.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                </div>

                {/* Selection Status and Controls */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: c.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Selected Papers ({selectedPapers.length})
                    </div>
                    {selectedPapers.length > 0 && (
                      <button
                        onClick={clearAllPapers}
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          border: `1px solid ${c.accent.warning}`,
                          borderRadius: '12px',
                          backgroundColor: 'transparent',
                          color: c.accent.warning,
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = `${c.accent.warning}15`
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = 'transparent'
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {selectedPapers.length > 0 && (
                    <div style={{
                      backgroundColor: `${c.accent.primary}10`,
                      border: `1px solid ${c.accent.primary}30`,
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '11px',
                      color: c.accent.primary
                    }}>
                      <strong>Active Selection:</strong> {selectedPapers.map(p => p.title).join(', ')}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: c.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Filter by Year
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['2020', '2018', '2017'].map(year => (
                      <button
                        key={year}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          border: `1px solid ${c.accent.primary}`,
                          borderRadius: '16px',
                          backgroundColor: year === '2020' ? c.accent.primary : 'transparent',
                          color: year === '2020' ? 'white' : c.accent.primary,
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (year !== '2020') {
                            e.target.style.backgroundColor = `${c.accent.primary}15`
                          }
                        }}
                        onMouseOut={(e) => {
                          if (year !== '2020') {
                            e.target.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {papers.map(paper => {
                    const isSelected = selectedPapers.some(p => p.id === paper.id)
                    return (
                      <div
                        key={paper.id}
                        onClick={() => togglePaperSelection(paper)}
                        style={{
                          padding: '14px',
                          border: `1px solid ${isSelected ? c.accent.primary : c.border}`,
                          borderRadius: '10px',
                          backgroundColor: isSelected ? `${c.accent.primary}08` : c.primary,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? `0 0 0 3px ${c.accent.primary}15` : 'none',
                          position: 'relative'
                        }}
                        onMouseOver={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = c.borderLight
                            e.currentTarget.style.backgroundColor = c.tertiary
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = c.border
                            e.currentTarget.style.backgroundColor = c.primary
                          }
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: c.accent.primary,
                            color: 'white',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            ✓
                          </div>
                        )}

                        <div style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          marginBottom: '6px',
                          color: isSelected ? c.accent.primary : c.text.primary,
                          lineHeight: '1.3'
                        }}>
                          {paper.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: c.text.secondary,
                          marginBottom: '6px'
                        }}>
                          {paper.authors.split(',')[0]} et al. • {paper.year}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: c.text.tertiary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>{paper.venue}</span>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {isSelected && (
                              <span style={{
                                backgroundColor: c.accent.primary,
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '9px',
                                fontWeight: 600
                              }}>
                                SELECTED
                              </span>
                            )}
                            <span style={{
                              backgroundColor: c.accent.success,
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 500
                            }}>
                              {paper.impact}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {activeLeftTab === 'projects' && (
              <>
                <button
                  onClick={createNewProject}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `1px solid ${c.accent.primary}`,
                    borderRadius: '10px',
                    background: c.accent.primary,
                    cursor: 'pointer',
                    marginBottom: '16px',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = c.accent.secondary
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = c.accent.primary
                  }}
                >
                  New IEEE Project
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {projects.map(project => (
                    <div
                      key={project.id}
                      style={{
                        padding: '14px',
                        border: `1px solid ${c.border}`,
                        borderRadius: '10px',
                        backgroundColor: c.primary,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = c.secondary
                        e.currentTarget.style.borderColor = c.accent.primary
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = c.primary
                        e.currentTarget.style.borderColor = c.border
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '14px', color: c.text.primary, marginBottom: '4px' }}>
                        {project.name}
                      </div>
                      <div style={{ fontSize: '12px', color: c.text.secondary }}>
                        IEEE Conference Template • Modified {project.lastModified}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Center - IEEE Template Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Document Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${c.border}`,
            backgroundColor: c.elevated
          }}>
            <input
              type="text"
              value={documentContent.title}
              onChange={(e) => handleSectionEdit('title', e.target.value)}
              style={{
                width: '100%',
                fontSize: '24px',
                fontWeight: 700,
                textAlign: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                color: c.text.primary,
                outline: 'none',
                padding: '8px'
              }}
            />
            <textarea
              value={documentContent.authors}
              onChange={(e) => handleSectionEdit('authors', e.target.value)}
              style={{
                width: '100%',
                fontSize: '14px',
                textAlign: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                color: c.text.secondary,
                outline: 'none',
                padding: '8px',
                resize: 'none',
                height: '60px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Section Navigation */}
          <div style={{
            display: 'flex',
            backgroundColor: c.secondary,
            borderBottom: `1px solid ${c.border}`,
            overflowX: 'auto'
          }}>
            {sections.map(section => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                style={{
                  padding: '14px 16px',
                  border: 'none',
                  borderBottom: activeSection === section.key ? `3px solid ${c.accent.primary}` : '3px solid transparent',
                  backgroundColor: activeSection === section.key ? c.primary : 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: activeSection === section.key ? c.accent.primary : c.text.secondary,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                {section.title}
              </button>
            ))}
          </div>

          {/* Editor Area */}
          <div style={{
            flex: 1,
            padding: '24px',
            overflow: 'auto',
            backgroundColor: c.primary
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <textarea
                value={documentContent[activeSection]}
                onChange={(e) => handleSectionEdit(activeSection, e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '500px',
                  padding: '20px',
                  border: `1px solid ${c.border}`,
                  borderRadius: '12px',
                  backgroundColor: c.secondary,
                  color: c.text.primary,
                  fontSize: '14px',
                  lineHeight: '1.7',
                  resize: 'vertical',
                  fontFamily: '"SF Mono", "Monaco", "Consolas", monospace',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                placeholder={`Write your ${sections.find(s => s.key === activeSection)?.title.toLowerCase()} here...`}
                onFocus={(e) => e.target.style.borderColor = c.accent.primary}
                onBlur={(e) => e.target.style.borderColor = c.border}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - VS Code style Copilot */}
        <aside style={{
          width: '360px',
          backgroundColor: c.secondary,
          borderLeft: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Copilot Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${c.border}`,
            backgroundColor: c.elevated
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: c.text.primary
              }}>
                AI Assistant
              </div>
              {selectedPapers.length > 0 && (
                <div style={{
                  fontSize: '11px',
                  color: c.accent.primary,
                  fontWeight: 500,
                  backgroundColor: `${c.accent.primary}10`,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  maxWidth: '280px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  📚 Using {selectedPapers.length} paper{selectedPapers.length > 1 ? 's' : ''}: {selectedPapers.map(p => p.title).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${c.border}`,
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={handlePopulate}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: c.accent.primary,
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              <span>📝</span>
              Populate
            </button>
            <button
              onClick={handleCite}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '12px',
                border: `1px solid ${c.border}`,
                borderRadius: '8px',
                backgroundColor: c.primary,
                color: c.text.primary,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>📖</span>
              Cite
            </button>
            <button
              onClick={handleSummarize}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '12px',
                border: `1px solid ${c.border}`,
                borderRadius: '8px',
                backgroundColor: c.primary,
                color: c.text.primary,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>📄</span>
              Summary
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {chatMessages.map((message, i) => (
              <div
                key={i}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: message.role === 'user'
                    ? c.accent.primary
                    : c.primary,
                  color: message.role === 'user' ? 'white' : c.text.primary,
                  fontSize: '14px',
                  lineHeight: '1.4',
                  border: message.role === 'assistant' ? `1px solid ${c.border}` : 'none',
                  boxShadow: message.role === 'user' ? `0 2px 8px ${c.accent.primary}30` : 'none'
                }}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div style={{
            padding: '16px',
            borderTop: `1px solid ${c.border}`,
            backgroundColor: c.elevated
          }}>
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything about your research..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: `1px solid ${c.border}`,
                  borderRadius: '8px',
                  backgroundColor: c.primary,
                  color: c.text.primary,
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = c.accent.primary}
                onBlur={(e) => e.target.style.borderColor = c.border}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                style={{
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: chatInput.trim() ? c.accent.primary : c.border,
                  color: 'white',
                  cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                Send
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Status Bar */}
      <footer style={{
        height: '28px',
        padding: '0 20px',
        borderTop: `1px solid ${c.border}`,
        backgroundColor: c.elevated,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: c.text.tertiary
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 500 }}>Research Copilot</span>
          <span>Section: {sections.find(s => s.key === activeSection)?.title}</span>
          <span>{documentContent[activeSection].length} characters</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: c.accent.success
          }}></div>
          <span>Copilot: Ready</span>
        </div>
      </footer>
    </div>
  )
}

export default App