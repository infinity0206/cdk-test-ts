import * as cdk from "@aws-cdk/core";
import { Table, AttributeType } from "@aws-cdk/aws-dynamodb";
import { AssetCode, Function, Runtime } from "@aws-cdk/aws-lambda";
import {
RestApi,
LambdaIntegration,
IResource,
MockIntegration,
PassthroughBehavior,
} from "@aws-cdk/aws-apigateway";

export class CdkTestTsStack extends cdk.Stack {
constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
super(scope, id, props);

    const dynamoTable = new Table(this, "items", {
      partitionKey: {
        name: "itemId",
        type: AttributeType.STRING,
      },
      tableName: "items",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const getItemLambda = new Function(this, "getOneItemFunction", {
      code: new AssetCode("lib/lambda"),
      handler: "get-item.handler",
      runtime: Runtime.NODEJS_10_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: "itemId",
      },
    });

    // dynamodb読み取り権限をLambdaに付与
    dynamoTable.grantReadData(getItemLambda);

    // ApiGateway
    const api = new RestApi(this, "sampleApi", {
      restApiName: "Sample API",
    });
    const items = api.root.addResource("items");

    const singleItem = items.addResource("{id}");
    const getItemIntegration = new LambdaIntegration(getItemLambda);
    singleItem.addMethod("GET", getItemIntegration);
    addCorsOptions(items);

}
}
export function addCorsOptions(apiResource: IResource) {
apiResource.addMethod(
  "OPTIONS",
new MockIntegration({
integrationResponses: [
{
statusCode: "200",
responseParameters: {
  "method.response.header.Access-Control-Allow-Headers":
  "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
  "method.response.header.Access-Control-Allow-Origin": "'*'",
  "method.response.header.Access-Control-Allow-Credentials":
  "'false'",
  "method.response.header.Access-Control-Allow-Methods":
  "'OPTIONS,GET,PUT,POST,DELETE'",
},
},
],
passthroughBehavior: PassthroughBehavior.NEVER,
requestTemplates: {
  "application/json": '{"statusCode": 200}',
},
}),
  {
  methodResponses: [
    {
    statusCode: "200",
      responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true,
      "method.response.header.Access-Control-Allow-Credentials": true,
      "method.response.header.Access-Control-Allow-Origin": true,
      },
    },
  ],
  }
);
}

const app = new cdk.App();
new CdkTestTsStack(app, "CdkTestTsStack");
app.synth();