import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')

describe('community package boundary', () => {
  it('registers only the TalorData SERP node', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

    expect(pkg.n8n.nodes).toEqual([
      'dist/nodes/TalordataSerp/TalordataSerp.node.js'
    ])
  })

  it('does not contain the removed Google Sheets writer source', () => {
    expect(fs.existsSync(path.join(root, 'nodes', 'TalordataSeoSheetWriter'))).toBe(false)
  })
})
