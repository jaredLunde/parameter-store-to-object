import {promisify} from 'util'
import {camelCase} from 'change-case'


const main = async (ssm, paths, opt = {}) => {
  paths = Array.isArray(paths) === true ? paths : [paths]
  let
    {
      withDecryption = true,
      recursive = true,
      parameterFilters,
      relativeTo = '',
      formatKey = camelCase,
      deserialize = (v => v)
    } = opt,
    parameters = [],
    names = paths.filter(name => name.startsWith('path:') === false)
  paths = paths.filter(name => name.startsWith('path:') === true)

  if (paths.length > 0) {
    const
      getParamsByPath = promisify(ssm.getParametersByPath.bind(ssm)),
      resolvePath = async path => {
        let NextToken, response, params = []

        while (!response || NextToken) {
          response = await getParamsByPath({
            ParameterFilters: parameterFilters,
            Path: path.replace('path:', ''),
            Recursive: recursive,
            WithDecryption: withDecryption,
            NextToken: NextToken
          })

          params.push.apply(params, response.Parameters)
          NextToken = response.NextToken
        }

        return params
      }

    parameters.push.apply(parameters, paths.map(resolvePath))
  }

  if (names.length > 0) {
    const
      getParameters = promisify(ssm.getParameters.bind(ssm)),
      resolveNames = async Names => {
        const response = await getParameters({Names, WithDecryption: withDecryption})
        return response.Parameters
      }

    parameters.push(resolveNames(names))
  }

  let output = {}
  parameters = (await Promise.all(parameters.flat())).flat()

  for (let i = 0, len = parameters.length; i < len; i++) {
    let
      {Name, Value} = parameters[i],
      keys = Name.replace(relativeTo, '').split('/').filter(Boolean),
      obj = output

    if (len === 1)
      obj[formatKey(keys[0])] = deserialize(Value)
    else
      for (let j = 0, len = keys.length; j < len; j++) {
        let key = formatKey(keys[j])

        if (obj.hasOwnProperty(key) === false)
          obj[key] = {}

        if (len - 1 === j)
          obj[key] = deserialize(Value)
        else
          obj = obj[key]
      }
  }

  return output
}

// main(ssm, ['path:/engrams'], {relativeTo: '/engrams/production'}).then(console.log)
export default main