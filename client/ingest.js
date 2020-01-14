const { createAWSConnection, awsCredsifyAll, awsGetCredentials } = require('@acuris/aws-es-connection')
const { Client } = require('@elastic/elasticsearch')
const faker = require('faker')

const {
    ELASTICSEARCH_URL,
} = process.env;

const INDEX_NAME = 'people';
const TOTAL_RECORDS = 1000;

const main = async () => {
    const awsCredentials = await awsGetCredentials()
    const AWSConnection = createAWSConnection(awsCredentials)
    const client = awsCredsifyAll(
    new Client({
        node: ELASTICSEARCH_URL,
        Connection: AWSConnection
    })
    )

    const { body: nodes } = await client.cat.nodes({
        format: 'json'
    });

    const { body: indices } = await client.cat.indices({
        format: 'json'
    });

    console.log("Nodes", nodes);
    console.log("Indices", indices);

    // Delete Index "people"
    try {
        await client.indices.delete({ index: INDEX_NAME });
    } catch (e) {
        // In all likelihood, the index doesn't exist yet.
    }

    // Create Index "people"

    await client.indices.create({ index: INDEX_NAME });

    // Create fake people
    for(let i = 0; i < TOTAL_RECORDS; i++) {
        try {
            const fakePerson = faker.helpers.createCard()
            await client.create({
                id: fakePerson.username,
                index: INDEX_NAME,
                body: fakePerson
            })
            console.log(`Created ${fakePerson.username}`);          
        } catch (e) {
            // In all likelihood, we are trying to overwrite an existing username
        }
    }
}

main()