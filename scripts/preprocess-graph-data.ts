import fs from "fs"
import path from "path"

interface YpoProfile {
  id: number
  name: string
  position: string | null
  current_company_name: string | null
  avatar: string | null
  ypo_chapter: string | null
  ypo_industry: string | null
  location: string | null
  similar_neighbors: Array<{
    id: number
    name: string
    similarity: number
  }>
  [key: string]: any
}

interface OptimizedProfile {
  id: number
  name: string
  position: string | null
  company: string | null
  avatar: string | null
  chapter: string | null
  industry: string | null
  location: string | null
  neighbors: Array<{
    id: number
    similarity: number
  }>
}

async function preprocessGraphData() {
  console.log("[v0] Reading original data file...")
  const dataPath = path.join(process.cwd(), "data", "similar-nodes.json")
  const rawData = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as YpoProfile[]

  console.log(`[v0] Processing ${rawData.length} profiles...`)

  const sampleSize = Math.floor(rawData.length * 1)
  const shuffled = [...rawData].sort(() => Math.random() - 0.5)
  const sampledData = shuffled.slice(0, sampleSize)

  console.log(`[v0] Sampled ${sampledData.length} profiles (10% of total)`)

  // Create a Set of all profile IDs that have connections (within the sample)
  const connectedIds = new Set<number>()
  sampledData.forEach((profile) => {
    if (profile.similar_neighbors && profile.similar_neighbors.length > 0) {
      connectedIds.add(profile.id)
      profile.similar_neighbors.forEach((neighbor) => {
        if (sampledData.find((p) => p.id === neighbor.id)) {
          connectedIds.add(neighbor.id)
        }
      })
    }
  })

  console.log(`[v0] Found ${connectedIds.size} connected profiles in sample`)

  // Create optimized map with only connected profiles and minimal data
  const optimizedMap: Record<number, OptimizedProfile> = {}

  sampledData.forEach((profile) => {
    if (connectedIds.has(profile.id)) {
      const validNeighbors =
        profile.similar_neighbors
          ?.filter((n) => connectedIds.has(n.id))
          .map((n) => ({
            id: n.id,
            similarity: n.similarity,
          })) || []

      optimizedMap[profile.id] = {
        id: profile.id,
        name: profile.name,
        position: profile.position,
        company: profile.current_company_name,
        avatar: profile.avatar,
        chapter: profile.ypo_chapter,
        industry: profile.ypo_industry,
        location: profile.location,
        neighbors: validNeighbors,
      }
    }
  })

  // Write optimized data
  const outputPath = path.join(process.cwd(), "data", "graph-data-optimized.json")
  fs.writeFileSync(outputPath, JSON.stringify(optimizedMap, null, 2))

  const originalSize = fs.statSync(dataPath).size
  const optimizedSize = fs.statSync(outputPath).size
  const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1)

  console.log(`[v0] Optimization complete!`)
  console.log(`[v0] Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`[v0] Optimized size: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`[v0] Size reduction: ${reduction}%`)
  console.log(`[v0] Profiles included: ${Object.keys(optimizedMap).length}`)
}

preprocessGraphData().catch(console.error)
