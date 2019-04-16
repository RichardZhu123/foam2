/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.notification.email',
  name: 'EmailTemplate',

  documentation: `Represents an email template that stores the default properties of a specific email, 
  mimics the EmailMessage which is the end obj that is processed into email.`,

  javaImports: [
    'foam.core.X',
    'foam.nanos.logger.Logger',
    'foam.nanos.notification.email.EmailMessage',
    'foam.util.SafetyUtil',
    'java.nio.charset.StandardCharsets',
    'org.jtwig.environment.EnvironmentConfiguration',
    'org.jtwig.environment.EnvironmentConfigurationBuilder',
    'org.jtwig.JtwigModel',
    'org.jtwig.JtwigTemplate',
    'org.jtwig.resource.loader.TypedResourceLoader'
  ],

  tableColumns: ['name', 'group'],

  properties: [
    {
      class: 'Long',
      name: 'id'
    },
    {
      class: 'String',
      name: 'name',
      documentation: 'Template name'
    },
    {
      class: 'String',
      name: 'group',
      value: '*'
    },
    {
      class: 'String',
      name: 'subject',
      documentation: 'Template subject'
    },
    {
      class: 'String',
      name: 'body',
      documentation: 'Template body',
      view: { class: 'foam.u2.tag.TextArea', rows: 40, cols: 150 },
      javaSetter:
        `body_ = val;
        bodyIsSet_ = true;`
    },
    {
      class: 'String',
      name: 'displayName',
      documentation: 'Displayed as the name in the email from field.'
    },
    {
      class: 'String',
      name: 'sendTo',
      documentation: 'This property will set to whomever the email is being sent to.'
    },
    {
      class: 'String',
      name: 'replyTo',
      documentation: 'Displayed as the from email field.'
    },
    {
      class: 'Array',
      name: 'bodyAsByteArray',
      hidden: true,
      transient: true,
      type: 'Byte[]',
      javaFactory: 'return getBody() != null ? getBody().getBytes(StandardCharsets.UTF_8) : null;'
    }
  ],
  methods: [
    {
      name: 'apply',
      type: 'foam.nanos.notification.email.EmailMessage',
      args: [
        {
          name: 'x',
          type: 'Context',
        },
        {
          name: 'group',
          class: 'String',
          documentation: 'group of user whose the recipient of the email being sent'
        },
        {
          name: 'emailMessage',
          type: 'foam.nanos.notification.email.EmailMessage',
          documentation: 'Email message'
        },
        {
          name: 'templateArgs',
          type: 'Map',
          documentation: 'Template arguments'
        }
      ],
      javaCode: `
        Logger logger = (Logger) x.get("logger");
        
        if ( emailMessage == null ) {
          logger.error("emailMessage is Null");
          return null;
        }

        String tempKeyString = "";
        Object value = null;
        JtwigModel model = null;
        EnvironmentConfiguration config = EnvironmentConfigurationBuilder
          .configuration()
            .resources()
              .resourceLoaders()
                .add(new TypedResourceLoader("dao", new DAOResourceLoader(x, group)))
                .and()
            .and()
          .build();

        for ( Object key : templateArgs.keySet() ) {
          value = templateArgs.get((String)key);
          if ( value instanceof String ) {
            tempKeyString = (String) value;
            templateArgs.put((String) key, new String(tempKeyString.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8));
          }
          model = JtwigModel.newModel(templateArgs);
          if ( model == null ) {
            logger.error("JtwigModel is Null");
            return null;
          }
        }

        return fillInEmailProperties_(x, emailMessage, model, config);
      `
    },
    {
      name: 'fillInEmailProperties_',
      type: 'foam.nanos.notification.email.EmailMessage',
      documentation: 'Applies template properties to emailMessage, where emailMessage property is empty',
      args: [
        {
          name: 'x',
          type: 'Context'
        },
        {
          name: 'emailMessage',
          type: 'foam.nanos.notification.email.EmailMessage'
        },
        {
          name: 'model',
          javaType: 'org.jtwig.JtwigModel'
        },
        {
          name: 'config',
          javaType: 'EnvironmentConfiguration'
        }
      ],
      javaCode: `
        // BODY:
        if ( SafetyUtil.isEmpty(emailMessage.getBody()) ) 
        {
          JtwigTemplate templateBody = JtwigTemplate.inlineTemplate(getBody(), config);
          emailMessage.setBody(templateBody.render(model));
        }
        
        // REPLY TO:
        if ( SafetyUtil.isEmpty(emailMessage.getReplyTo()) &&
          ! foam.util.SafetyUtil.isEmpty(getReplyTo()) )
        {
            JtwigTemplate templateDisplayName = JtwigTemplate.inlineTemplate(getReplyTo(), config);
            emailMessage.setReplyTo(templateDisplayName.render(model));
        } 

        // DISPLAY NAME:
        if ( SafetyUtil.isEmpty(emailMessage.getDisplayName()) &&
          ! foam.util.SafetyUtil.isEmpty(getDisplayName()) )
        {
          JtwigTemplate templateDisplayName = JtwigTemplate.inlineTemplate(getDisplayName(), config);
          emailMessage.setDisplayName(templateDisplayName.render(model));
        }

        // SUBJECT:
        if ( foam.util.SafetyUtil.isEmpty(emailMessage.getSubject()) &&
          ! foam.util.SafetyUtil.isEmpty(getSubject()))
        {
          JtwigTemplate templateSubject = JtwigTemplate.inlineTemplate(getSubject(), config);
          emailMessage.setSubject(templateSubject.render(model));
        }

        // SEND TO:
        if ( emailMessage.getTo().length == 0 &&
          ! foam.util.SafetyUtil.isEmpty(getSendTo()) )
        {
          JtwigTemplate templateSendTo = JtwigTemplate.inlineTemplate(getSendTo(), config);
          emailMessage.setTo(new String[] {templateSendTo.render(model)});
        }

        return emailMessage;
      `
    }
  ]
});
