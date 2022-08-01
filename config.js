import envSchema from 'env-schema'
import S from 'fluent-json-schema'

const schema = S.object()
  .prop('PORT', S.number().default(8080))
  .prop('LOG_LEVEL', S.string().default('info'))
  .prop('APP_ID', S.string().default(''))
  .prop('APP_KEY', S.string().default(''))

const config = envSchema({
  schema,
  dotenv: true
})

export default config
