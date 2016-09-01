/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
foam.CLASS({
  package: 'foam.u2.search',
  name: 'TextSearchView',
  extends: 'foam.u2.View',
  requires: [
    'foam.mlang.predicate.ContainsIC',
    'foam.mlang.predicate.True',
    'foam.parse.QueryParser',
    'foam.u2.tag.Input'
  ],

  properties: [
    {
      class: 'Class2',
      name: 'of'
    },
    {
      class: 'Boolean',
      name: 'richSearch',
      value: false
    },
    {
      class: 'Boolean',
      name: 'keywordSearch',
      value: false
    },
    {
      name: 'queryParser',
      factory: function() {
        return this.QueryParser.create({ of: this.of });
      }
    },
    {
      class: 'Int',
      name: 'width',
      value: 47
    },
    'property',
    {
      name: 'predicate',
      factory: function() { return this.True.create(); }
    },
    {
      name: 'view',
      factory: function() {
        return this.Input.create({ type: 'search' });
      }
    },
    {
      name: 'label',
      expression: function(property) {
        return property && property.label ? property.label : 'Search';
      }
    },
    {
      // All search views (in the SearchManager) need a name.
      // This defaults to 'query'.
      name: 'name',
      value: 'query'
    }
  ],

  methods: [
    function initE() {
      this.cssClass(this.myCls()).add(this.view);
      this.view.data$.sub(this.updateValue);
    },
    function clear() {
      this.view.data = '';
      this.predicate = this.True.create();
    }
  ],

  listeners: [
    {
      name: 'updateValue',
      code: function() {
        var value = this.view.data;
        this.predicate = ! value ?
            this.True.create() :
            this.richSearch ?
                this.queryParser.parseString(value) :
                this.ContainsIC(this.property, value);
      }
    }
  ]
});
