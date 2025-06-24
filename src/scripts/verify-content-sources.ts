import { supabase } from '../lib/supabase'

async function verifyContentSources() {
  console.log('🔍 Verifying content sources in database...')
  
  const { data, error } = await supabase
    .from('content_sources')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('❌ Error fetching content sources:', error)
    process.exit(1)
  }
  
  console.log(`📊 Found ${data?.length || 0} content sources in database:`)
  console.log('')
  
  data?.forEach((source, index) => {
    console.log(`${index + 1}. ${source.name}`)
    console.log(`   URL: ${source.url}`)
    console.log(`   Type: ${source.type}`)
    console.log(`   Description: ${source.description || 'No description'}`)
    console.log(`   Has embedding: ${source.embedding ? '✅' : '❌'}`)
    console.log('')
  })
  
  console.log('✅ Verification completed!')
}

// Run the verification script
if (require.main === module) {
  verifyContentSources()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error)
      process.exit(1)
    })
}

export { verifyContentSources } 