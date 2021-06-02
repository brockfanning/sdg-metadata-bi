const path = require('path')
const sdgMetadataConvert = require('sdg-metadata-convert')
const yamlOutput = new sdgMetadataConvert.YamlOutput()
const request = require('request')
const conceptIds = sdgMetadataConvert.conceptStore.getConceptIds()

const sourceFile = 'http://brock.tips/fcdo/burundi/sdg-build/en/meta/all.json'
const options = { json: true }
request(sourceFile, options, (error, res, body) => {
    if (error) {
        return  console.log(error)
    }

    if (!error && res.statusCode == 200) {
        for (const indicatorId of Object.keys(body)) {
            const concepts = {}
            for (const concept of Object.keys(body[indicatorId])) {
                if (conceptIds.includes(concept)) {
                    concepts[concept] = body[indicatorId][concept]
                }
            }
            const metadata = new sdgMetadataConvert.Metadata(concepts)
            const outputFile = path.join('translations', 'fr', indicatorId + '.yml')
            writeFile(metadata, outputFile)
        }
    }
})

async function writeFile(metadata, outputFile) {
    await yamlOutput.write(metadata, outputFile)
}
