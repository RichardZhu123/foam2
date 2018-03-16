/**
 * @license
 * Copyright 2018 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'ProfilePictureView',
  extends: 'foam.u2.Element',

  requires: [
    'foam.blob.BlobBlob',
    'foam.nanos.fs.File',
    'foam.u2.dialog.NotificationMessage'
  ],

  imports: [
    'user',
    'blobService'
  ],

  exports: [
    'as data',
  ],

  css: `
    ^ .attachment-input {
      width: 0.1px;
      height: 0.1px;
      opacity: 0;
      overflow: hidden;
      position: absolute;
      z-index: -1;
    }
    ^ .attachment-btn {
      margin: 10px 0;
    }
    ^ .shopperImage {
      width: 80px;
      height: 80px;
      display: inline-block;
      border: solid 1px #a4b3b8;
      border-radius: 50%;
      object-fit: cover;
    }
    ^ .uploadButtonContainer {
      height: 80px;
      display: inline-block;
      vertical-align: text-bottom;
      margin-left: 40px;
    }
    ^ .removeButtonContainer {
      display: inline-block;
      vertical-align: text-bottom;
      margin-left: 20px;
      vertical-align: top;
      margin-top: 5px;
    }
    ^ .net-nanopay-ui-ActionView-uploadImage {
      width: 136px;
      height: 40px;
      background: transparent;
      border: solid 1px #59a5d5;
      color: #59a5d5;
      margin: 0;
      outline: none;
    }
    ^ .uploadDescContainer{
      position: absolute;
      left: 132px;
      bottom: 9px;
    }
    ^ .uploadDescription {
      margin-top: 9px;
      font-size: 14px;
      font-weight: 300;
      letter-spacing: 0.2px;
      color: %SECONDARYCOLOR%;
    }
    ^ .uploadRestriction {
      margin-top: 9px;
      font-size: 10px;
      font-weight: 300;
      letter-spacing: 0.2px;
      color: #093649;
    }
    ^ .box-for-drag-drop {
      border: dashed 4px #edf0f5;
      width: 90%;
      height: 110px;
      padding: 10px 10px;
      position: relative;
    }
    ^ .boxless-for-drag-drop {
      border: solid 4px white;
      width: 90%;
      height: 110px;
      padding: 10px 10px;
      position: relative;
    }
  `,

  properties: [
    {
      class: 'foam.nanos.fs.FileProperty',
      name: 'data'
    },
    {
      class: 'Boolean',
      name: 'isDrag',
      value: false
    },
    [ 'uploadHidden', false ]
  ],

  messages: [
    { name: 'UploadImageLabel', message: 'Choose File' },
    { name: 'RemoveImageLabel', message: 'Remove File' },
    { name: 'UploadDesc', message: 'Or drag and drop an image here' },
    { name: 'UploadRestrict', message: '* jpg, jpeg, or png only, 2MB maximum, 100*100 72dpi recommanded' },
    { name: 'FileError', message: 'File required' },    
    { name: 'FileTypeError', message: 'Wrong file format' },
    { name: 'ErrorMessage', message: 'Please upload an image less than 2MB' }
  ],

  methods: [
    function initE() {
      var self = this;
      this
        .addClass(this.myClass())
        .start('div').addClass(this.isDrag$.map(function (drag) {
          return drag ? 'box-for-drag-drop':'boxless-for-drag-drop';
        }))
          .add(this.slot(function (data) {
            return this.E('img').addClass('shopperImage')
            .attrs({
              src: this.data$.map(function (data) {
                if ( data && data.data ) {
                  var blob = data.data;
                  var sessionId = localStorage['defaultSession'];
                  if ( self.BlobBlob.isInstance(blob) ) {
                    return URL.createObjectURL(blob.blob);
                  } else {
                    var url = '/service/httpFileService/' + data.id;
                    // attach session id if available
                    if ( sessionId ) {
                      url += '?sessionId=' + sessionId;
                    }
                    return url;
                  }
                } else {
                  return 'images/person.svg'
                }
              })
            });
          }, this.data$))
          .on('dragstart', this.onDragStart)
          .on('dragenter', this.onDragEnter)
          .on('dragover', this.onDragOver)
          .on('drop', this.onDrop)
          .start().addClass('uploadButtonContainer').hide(this.uploadHidden)
            .start('input').addClass('attachment-input')
              .attrs({
                type: 'file',
                accept: 'image/jpg,image/gif,image/jpeg,image/bmp,image/png'
              })
              .on('change', this.onChange)
            .end()
            .start().addClass('attachment-btn white-blue-button btn')
              .add(this.UploadImageLabel)
              .on('click', this.onAddAttachmentClicked)
            .end()
          .end()
          .start().addClass('removeButtonContainer').show( !(this.uploadHidden) && this.data$.map(function (data) {
              return data;
            }))
            .start().addClass('attachment-btn grey-button btn')
              .add(this.RemoveImageLabel)
              .on('click', this.onRemoveClicked)
            .end()
          .end()
          .start().addClass('uploadDescContainer').hide(this.uploadHidden)
            .start().add(this.UploadDesc).addClass('uploadDescription').end()
            .start().add(this.UploadRestrict).addClass('uploadRestriction').end()
          .end()
        .end()
    }
  ],

  listeners: [
    function onAddAttachmentClicked (e) {
      this.document.querySelector('.attachment-input').click();
    },
    function onRemoveClicked (e) {
      this.isDrag = false;
      this.data = null;
    },
    function onDragOver(e) {
      this.isDrag = true;
      e.preventDefault();    
    },
    function onDrop(e) {
      e.preventDefault();  
      this.isDrag = false;
      if(this.uploadHidden){
        return;
      }
      else{
        var inputFile;
        if (e.dataTransfer.items) {
          inputFile = e.dataTransfer.items[0]
          if (inputFile.kind === 'file') {     
            var file = inputFile.getAsFile();
            if(this.isRightType(file)){
              this.addFile(file);
            }
            else{
              this.add(this.NotificationMessage.create({ message: this.FileTypeError, type: 'error' }));
            } 
          }
        }else if(e.dataTransfer.files){
          var file = e.dataTransfer.files[0];
          if(this.isRightType(file)) 
            this.addFile(file);
          else{
            this.add(this.NotificationMessage.create({ message: this.FileTypeError, type: 'error' }));
          }  
        }
      }
    },
    function isRightType(file){
      if(file.type === "image/jpg" 
      || file.type === "image/jpeg" 
      || file.type === "image/png") {
        return true;
      }
      return false;
    },
    function onChange (e) {
      this.isDrag = false;

      var file = e.target.files[0];
      this.addFile(file);
    },
    function addFile (file) {
      if ( file.size > ( 2 * 1024 * 1024 ) ) {
        this.add(this.NotificationMessage.create({ message: this.ErrorMessage, type: 'error' }));
        return;
      }
      this.data = this.File.create({
        owner: this.user.id,
        filename: file.name,
        filesize: file.size,
        mimeType: file.type,
        data: this.BlobBlob.create({
          blob: file
        })
      });
    }
  ]
});
