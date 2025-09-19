sap.ui.define(function () {
	"use strict";

	return {
		name: "QUnit test suite for the UI5 Application: myapp",
		defaults: {
			page: "ui5://test-resources/myapp/Test.qunit.html?testsuite={suite}&test={name}",
			qunit: {
				version: 2
			},
			sinon: {
				version: 1
			},
			ui5: {
				language: "EN",
				theme: "sap_horizon"
			},
			coverage: {
				only: "myapp/",
				never: "test-resources/myapp/"
			},
			loader: {
				paths: {
					"myapp": "../"
				}
			}
		},
		tests: {
			"unit/unitTests": {
				title: "Unit tests for myapp"
			},
			"integration/opaTests": {
				title: "Integration tests for myapp"
			}
		}
	};
});
