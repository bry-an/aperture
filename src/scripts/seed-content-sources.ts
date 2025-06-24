import { parse } from 'csv-parse'
import { createReadStream } from 'fs'
import { join } from 'path'
import { supabase } from '../lib/supabase'
import { generateEmbeddings } from '../lib/openai'

interface ContentSource {
  name: string
  url: string
  description: string
}

async function seedContentSources() {
  console.log('🌱 Starting content sources seeding...')
  
  const csvPath = join(__dirname, '../../resources/content_sources.csv')
  const contentSources: ContentSource[] = []
  
  // Read and parse CSV file
  return new Promise<void>((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row: ContentSource) => {
        contentSources.push(row)
      })
      .on('end', async () => {
        try {
          console.log(`📖 Found ${contentSources.length} content sources in CSV`)
          
          // Generate embeddings for all content sources
          const embeddingTexts = contentSources.map(source => 
            `${source.name}. ${source.description || ''} (${source.url})`
          )
          
          console.log('🧠 Generating embeddings...')
          const embeddings = await generateEmbeddings(embeddingTexts)
          
          // Prepare data for insertion
          const insertData = contentSources.map((source, index) => ({
            name: source.name,
            description: source.description,
            url: source.url,
            type: 'rss' as const, // All current sources are RSS feeds
            embedding: embeddings[index]
          }))
          
          // Insert into database
          console.log('💾 Inserting content sources into database...')
          const { data, error } = await supabase
            .from('content_sources')
            .insert(insertData)
            .select()
          
          if (error) {
            console.error('❌ Error inserting content sources:', error)
            reject(error)
            return
          }
          
          console.log(`✅ Successfully seeded ${data?.length || 0} content sources`)
          console.log('📋 Seeded sources:')
          data?.forEach(source => {
            console.log(`  - ${source.name} (${source.url})`)
          })
          
          resolve()
        } catch (error) {
          console.error('❌ Error during seeding:', error)
          reject(error)
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error)
        reject(error)
      })
  })
}

// Run the seeding script
if (require.main === module) {
  seedContentSources()
    .then(() => {
      console.log('🎉 Content sources seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Content sources seeding failed:', error)
      process.exit(1)
    })
}

export { seedContentSources } 