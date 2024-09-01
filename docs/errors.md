# Errors

This document details all the well-known errors that can be returned from the
Event Management Service. Each section will be accessible from the `type` field
on the returned error.

# Unauthorized Error

If this error occurs, the user is not authorised to access the endpoint. Please
ensure that the authorization token is correct defined using the following as an
example:

| Header name     | Header value                                              | User ID                                |
| --------------- | --------------------------------------------------------- | -------------------------------------- |
| `authorization` | `Bearer NmU4NTllMjgtODZjMy00ZWI5LTk2NzQtZjQ4YWM4OWNjMWM1` | `6e859e28-86c3-4eb9-9674-f48ac89cc1c5` |

# Unprocessable Content Error

If this error occurs, the endpoint has been called with invalid input. Please
check that the provided input is correct.

# Event Not Found Error

If this error occurs, the event does not exist. Please check that the provided
search parameters are correct.

# Event Bad Request Error

If this error occurs, there was an issue with the request. Check the error
details for more info.

# Event Internal Server Error

If this error occurs, there was an internal issue with the request. Please
contact the maintainers of the API to resolver this issue.
