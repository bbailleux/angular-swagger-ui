/*
 * angular-swagger-ui
 * http://github.com/maales/angular-swagger-ui
 * Version: 0.1.0 - 2015-02-26
 * License: MIT
 */
'use strict';

angular
	.module('swaggerUi')
	.service('swaggerClient', ['$q', '$http', function($q, $http) {

		function formatResult(deferred, data, status, headers, config) {
			deferred.resolve({
				url: config.url,
				response: {
					body: data ? (angular.isString(data) ? data : angular.toJson(data, true)) : 'no content',
					status: status,
					headers: angular.toJson(headers(), true)
				}
			});
		}

		this.send = function(swagger, operation, values, transform) {
			var deferred = $q.defer(),
				query = {},
				headers = {},
				path = operation.path;

			// build request parameters
			for (var i = 0, params = operation.parameters || [], l = params.length; i < l; i++) {
				//TODO manage 'collectionFormat' (csv etc.) !!
				var param = params[i],
					value = values[param.name];

				switch (param.in) {
					case 'query':
						if (!!value) {
							query[param.name] = value;
						}
						break;
					case 'path':
						path = path.replace('{' + param.name + '}', encodeURIComponent(value));
						break;
					case 'header':
						if (!!value) {
							headers[param.name] = value;
						}
						break;
					case 'formData':
						values.body = values.body || new FormData();
						if (!!value) {
							if (param.type === 'file') {
								values.contentType = undefined; // make browser defining it by himself
							}
							values.body.append(param.name, value);
						}
						break;
				}
			}

			// add headers
			headers.Accept = values.responseType;
			headers['Content-Type'] = values.body ? values.contentType : 'text/plain';

			// build request
			//FIXME should use server hosting the documentation if scheme or host are not defined
			var request = {
					method: operation.httpMethod,
					url: [swagger.schemes && swagger.schemes[0] || 'http', '://', swagger.host, swagger.basePath || '', path].join(''),
					headers: headers,
					data: values.body,
					params: query
				},
				callback = function(data, status, headers, config) {
					formatResult(deferred, data, status, headers, config);
				};

			// apply transform
			if (typeof transform === 'function') {
				transform(request);
			}

			// send request
			$http(request)
				.success(callback)
				.error(callback);

			return deferred.promise;
		};

	}]);
