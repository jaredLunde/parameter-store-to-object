# parameter-store-to-object

## Installation
`yarn add parameter-store-to-object`

## Usage
```js
import ssmParamsToObj from 'parameter-store-to-object'
import * as aws from 'aws-sdk'


const getSSMParameters = async () => {
  let ssm = new aws.SSM({region: 'us-east-1'})
  return await ssmParamsToObj(
    ssm, 
    ['path:/foo/bar', '/foo/boz/baz'], 
    {relativeTo: '/foo'}
  )
}
```