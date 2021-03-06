/*!
 * ${copyright}
 */

sap.ui.define([
  "jquery.sap.global",
  "sap/ui/base/Object"
], function ($, UI5Object) {
  "use strict";

  /**
   * A Gherkin feature file is human-readable, and the computer does not know how to execute its steps. This
   * StepDefinitions class provides the interface between human and machine. It defines what each step in the Gherkin
   * feature file will actually do when it is executed.
   *
   * Meant to be implemented/overridden by a child object. Specifically, the functions "init" and "closeApplication"
   * need to be overridden.
   *
   * @abstract
   * @class
   * @author Rodrigo Jordao
   * @author Jonathan Benn
   * @extends sap.ui.base.Object
   * @alias sap.ui.test.gherkin.StepDefinitions
   * @since 1.40
   * @public
   */
	var StepDefinitions = UI5Object.extend("sap.ui.test.gherkin.StepDefinitions",
      /** @lends sap.ui.test.gherkin.StepDefinitions.prototype */ {

        constructor : function() {
          UI5Object.apply(this, arguments);

          /**
           * {StepDefinition[]} An array of StepDefinition objects, one of which is added to the array every time
           * the user calls the "register" method. Each StepDefinition object can generate one TestStep object.
           *
           * @see #register
           * @see #_generateTestStep
           * @private
           */
          this._aDefinitions = [];
          this.init();
        },

        /**
         * Registers the step definitions by calling the method "register".
         *
         * @see #register
         * @abstract
         * @public
         * @function
         * @static
         */
        init : function() {},

        /**
         * Closes the application and cleans up any mess made by the tests. To avoid erroneous exceptions during test
         * execution, make sure that it is safe to run this method even if the application was never started.
         *
         * @abstract
         * @public
         * @function
         * @static
         */
        closeApplication: function() {},

        /**
         * Registers a step definition.
         *
         * @param {RegExp} rRegex - the regular expression that matches the feature file step (with leading "Given", "When",
         *                          "Then", "But" or "*" removed). E.g. if the feature file has the step
         *                          "Then I should be served a coffee" it will be truncated to "I should be served a coffee"
         *                          and tested against "rRegex" to check for a match. The simple regular expression
         *                          /^I should be served a coffee$/i would match this text. The regular
         *                          expression can specify capturing groups, which will be passed as parameters to "fnFunc".
         * @param {function} fnFunc - the function to execute in the event that the regular expression matches. Receives
         *                            regular expression capturing groups as parameters in the same order that they are
         *                            specified in the regular expression. If a data table is specified for the step, it
         *                            will be passed as an additional final parameter. At execution time, all functions
         *                            within a particular scenario will execute within the same "this" context.
         * @throws {Error} if any parameters are invalid, or if method is called twice with the same value for 'rRegex'
         * @public
         * @function
         * @static
         */
        register : function(rRegex, fnFunc) {
          if ($.type(rRegex) !== "regexp") {
            throw new Error("StepDefinitions.register: parameter 'rRegex' must be a valid RegExp object");
          }
          if ($.type(fnFunc) !== "function") {
            throw new Error("StepDefinitions.register: parameter 'fnFunc' must be a valid Function");
          }

          this._aDefinitions.forEach(function(oStepDef) {
            if (oStepDef.rRegex.source === rRegex.source) {
              throw new Error("StepDefinitions.register: Duplicate step definition '" + rRegex + "'");
            }
          });

          this._aDefinitions.push({
            rRegex: rRegex,
            generateTestStep: function(oStep) {
              var aMatch = oStep.text.match(rRegex);
              if (!aMatch) { return {isMatch: false}; }
              var aParams = aMatch.slice(1);
              if (oStep.data) { aParams.push($.extend(true, [], oStep.data)); }
              return {
                isMatch: true,
                text: oStep.text,
                regex: rRegex,
                parameters: aParams,
                func: fnFunc
              };
            }
          });
        },

        /**
         * Searches through the registered step definitions, finds the one that matches the given Gherkin test step and
         * generates a new TestStep object that combines the two.
         *
         * @param {object} oStep - a Gherkin test step, optionally with an associated data table
         * @param {string} oStep.text - the Gherkin test step's human-readable text
         * @param {string[][]} [oStep.data] - (optional) a matrix of strings that represents a Gherkin data table
         * @returns {TestStep} a TestStep object
         * @see sap.ui.test.gherkin.GherkinTestGenerator
         * @private
         */
        _generateTestStep : function(oStep) {
          for (var i = 0; i < this._aDefinitions.length; ++i) {
            var oDefinition = this._aDefinitions[i];
            var oTestStep = oDefinition.generateTestStep(oStep);
            if (oTestStep.isMatch) {
              return oTestStep;
            }
          }
          return {
            isMatch: false,
            text: "(NOT FOUND) " + oStep.text
          };
        }

      });
  return StepDefinitions;

}, /* bExport= */ true);
