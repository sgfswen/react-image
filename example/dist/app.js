require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var React = require('react');
var Img = require('react-image');

var selfCleaningTimeout = {
    componentDidUpdate: function() {
        clearTimeout(this.timeoutID);
    },

    setTimeout: function() {
        clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout.apply(null, arguments);
    }
};

var ComponentPreview = React.createClass({displayName: "ComponentPreview",
    propTypes: {
        code: React.PropTypes.string.isRequired
    },

    mixins: [selfCleaningTimeout],

    render: function() {
        return React.createElement("div", {ref: "mount"});
    },

    componentDidMount: function() {
        this.executeCode();
    },

    componentDidUpdate: function(prevProps) {
        // execute code only when the state's not being updated by switching tab
        // this avoids re-displaying the error, which comes after a certain delay
        if (this.props.code !== prevProps.code) {
            this.executeCode();
        }
    },

    compileCode: function() {
        return JSXTransformer.transform(
                '(function() {' +
                this.props.code +
                '\n})();',
            { harmony: true }
        ).code;
    },

    executeCode: function() {
        var mountNode = this.refs.mount.getDOMNode();

        try {
            React.unmountComponentAtNode(mountNode);
        } catch (e) { }

        try {
            var compiledCode = this.compileCode();
            React.render(eval(compiledCode), mountNode);
        } catch (err) {
            this.setTimeout(function() {
                React.render(
                    React.createElement("div", {className: "playgroundError"}, err.toString()),
                    mountNode
                );
            }, 500);
        }
    }
});

var IS_MOBILE = (
    navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
    );

var CodeMirrorEditor = React.createClass({displayName: "CodeMirrorEditor",
    componentDidMount: function() {
        if (IS_MOBILE) return;

        this.editor = CodeMirror.fromTextArea(this.refs.editor.getDOMNode(), {
            mode: 'javascript',
            lineNumbers: true,
            lineWrapping: true,
            smartIndent: false,  // javascript mode does bad things with jsx indents
            matchBrackets: true,
            readOnly: this.props.readOnly
        });
        this.editor.on('change', this.handleChange);

        this.editor.on('beforeSelectionChange', function(instance, obj){
            // why is ranges plural?
            var selection = obj.ranges ?
                obj.ranges[0] :
                obj;

            var noRange = selection.anchor.ch === selection.head.ch &&
                selection.anchor.line === selection.head.line;
            if (!noRange) {
                return;
            }

            var cursor = selection.anchor;
            var line = instance.getLine(cursor.line);
            var match = OPEN_MARK.exec(line) || CLOSE_MARK.exec(line);

            // the opening or closing mark appears on this line
            if (match &&
                // and the cursor is on it
                // (this is buggy if both occur on the same line)
                cursor.ch >= match.index &&
                cursor.ch < match.index + 3) {

                // TODO(joel) - figure out why this doesn't fold although it
                // seems like it should work.
                instance.foldCode(cursor, { widget: '...' });
            }
        });
    },

    componentDidUpdate: function() {
        if (this.props.readOnly) {
            this.editor.setValue(this.props.codeText);
        }
    },

    handleChange: function() {
        if (!this.props.readOnly && this.props.onChange) {
            this.props.onChange(this.editor.getValue());
        }
    },

    render: function() {
        // wrap in a div to fully contain CodeMirror
        var editor;

        if (IS_MOBILE) {
            editor = React.createElement("pre", {style: {overflow: 'scroll'}}, this.props.codeText);
        } else {
            editor = React.createElement("textarea", {ref: "editor", defaultValue: this.props.codeText});
        }

        return (
            React.createElement("div", {style: this.props.style, className: this.props.className}, 
            editor
            )
            );
    }
});

var ReactPlayground = React.createClass({displayName: "ReactPlayground",
    propTypes: {
        codeText: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
        return {
            code: this.props.codeText
        };
    },

    handleCodeChange: function(code) {
        this.setState({
            code: code
        });
    },

    render: function() {
        return React.createElement("div", {className: "playground"}, 
            React.createElement("div", {className: "playgroundCode"}, 
                React.createElement(CodeMirrorEditor, {key: "jsx", 
                onChange: this.handleCodeChange, 
                className: "playgroundStage", 
                codeText: this.state.code})
            ), 
            React.createElement("div", {className: "playgroundPreview"}, 
                React.createElement(ComponentPreview, {code: this.state.code})
            )
        );
    }
});

React.render(
    React.createElement(ReactPlayground, {codeText: document.getElementById('code1').innerHTML}),
    document.getElementById('example1')
);

React.render(
    React.createElement(ReactPlayground, {codeText: document.getElementById('code2').innerHTML}),
    document.getElementById('example2')
);

React.render(
    React.createElement(ReactPlayground, {codeText: document.getElementById('code3').innerHTML}),
    document.getElementById('example3')
);

},{"react":undefined,"react-image":undefined}]},{},[1]);
