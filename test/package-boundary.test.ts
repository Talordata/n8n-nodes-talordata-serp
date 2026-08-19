import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')

describe('community package boundary', () => {
  it('publishes the multi-format parser as version 0.1.10', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

    expect(pkg.version).toBe('0.1.10')
  })

  it('registers only the TalorData SERP node', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

    expect(pkg.n8n.nodes).toEqual([
      'dist/nodes/TalordataSerp/TalordataSerp.node.js'
    ])
  })

  it('does not contain the removed Google Sheets writer source', () => {
    expect(fs.existsSync(path.join(root, 'nodes', 'TalordataSeoSheetWriter'))).toBe(false)
  })

  it('does not depend on Dify project files', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

    expect(pkg.scripts).not.toHaveProperty('generate')
    expect(fs.existsSync(path.join(root, 'scripts', 'generate-from-dify-serp.js'))).toBe(false)
  })
})
