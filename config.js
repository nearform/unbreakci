import envSchema from 'env-schema'
import S from 'fluent-json-schema'

const schema = S.object()
  .prop('PORT', S.number().default(3000))
  .prop('APP_ID', S.string().default(''))
  .prop('APP_KEY', S.string().default(''))
  .prop('WEBHOOK_SECRET', S.string().default(''))
  .prop('COLUMN_NAME', S.string().default(''))
  .prop('PROJECT_NUMBER', S.number().default(null))
  .prop('PR_AUTHOR', S.string().default('dependabot'))
  .prop('LOG_LEVEL', S.string().default('info'))

const config = envSchema({
  schema,
  dotenv: true
})

export default config
