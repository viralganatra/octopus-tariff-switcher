# Testing Locally

# Step 1 - Setup AWS Accounts

If you haven't already, setup your AWS accounts [using the guide](https://sst.dev/docs/aws-accounts).

# Step 2 - Deploy the local stack

Run the following command to deploy your services to the local stage:

```
pnpm dev
```

Once deployed, you'll see output similar to this:

```
✓  Complete
   OctopusTariffSwitcherApiRouteBhfcdoHandler: https://psrmcfexqco3srtql5gn4tf2sm0djukx.lambda-url.eu-west-2.on.aws/
   OctopusTariffSwitcherCronHandler: https://na6cv7r4dsxsfhqy2w7pnrzwcq0ehvvy.lambda-url.eu-west-2.on.aws/
   OctopusTariffSwitcherPublishYesterdaysTariffCronHandler: https://ywxpwsvhc7ym6wwopfthflbkxq0cbqgb.lambda-url.eu-west-2.on.aws/
   OctopusTariffSwitcherWriteQueueSubscriberBnkeuxFunction: https://vucjyndk45dajrlzuz3bf6nhqy0dbjpk.lambda-url.eu-west-2.on.aws/
   OctopusTariffSwitcherApi: https://fhbi5r0tr0.execute-api.eu-west-2.amazonaws.com
```

**Note**: In dev mode, Lambda functions are accessible directly via their URLs. In production, this is disabled.

All Lambda functions are secured with [authorization: 'iam'](https://sst.dev/docs/component/aws/function#url-authorization). This means that all requests must be [AWS-signed](https://docs.aws.amazon.com/AmazonS3/latest/API/RESTAuthentication.html); unauthenticated requests will be rejected.

If you’re familiar with AWS request signing, you can quickly export credentials for local testing:

```
aws configure export-credentials --profile ${aws_profile}`
```

# Step 3 — Configure Postman for testing

To simplify signing requests, you can use [Postman](https://www.postman.com/).

1. Run the following script to generate credentials in Postman format:

```
pnpm generate:creds
```

This creates a `postman.env.json` file with a set of temporary credentials.

2.  In Postman:
* Go to **Environments → Import** and import `postman.env.json`.
* Create a new request with the Lambda URL you want to test (e.g., https://npsnr7dxzh4ulibtgmxqncwut40ugnuh.lambda-url.eu-west-2.on.aws/).
* In the request's **Authorization** tab:
* Set **Auth Type** to **AWS Signature**.
* Populate **Access Key**, **Secret Key**, **AWS Region**, **Service Name**, and **Session Token** using the imported environment variables (e.g., `{{AWS_ACCESS_KEY_ID}})`
* **Important**: By default, the script sets the service name to `execute-api`. For Lambda URLs, change Service Name to `lambda`.

# Step 4 — Send the request

Send the request. If your credentials and configuration are correct, the request should succeed.
