const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const assets = [
  {
    source: path.join(root, 'nodes', 'TalordataSerp', 'icon.png'),
    target: path.join(root, 'dist', 'nodes', 'TalordataSerp', 'icon.png')
  }
]

for (const asset of assets) {
  fs.mkdirSync(path.dirname(asset.target), { recursive: true })
  fs.copyFileSync(asset.source, asset.target)
}
