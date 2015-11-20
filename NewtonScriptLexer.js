/*
 * USAGE: 
 *      lexNewtonScript(outputType, inputString);
 *              outputType: either "XML" or "JSON" or "ARRAY"
 *              inputString: NewtonScript string
 * 
 * NOTE: The input string must only be as is described in the "Lexical Grammar"
 *       sub-section of section D from document: https://manuals.info.apple.com/MANUALS/1000/MA1508/en_US/NewtonScriptProgramLanguage.PDF
*/


if (typeof module === "object" && typeof module.exports === "object") module.exports = Lexer;

Lexer.defunct = function (chr) {
    throw new Error("Unexpected character at index " + (this.index - 1) + ": " + chr);
};

function Lexer(defunct) {
    if (typeof defunct !== "function") defunct = Lexer.defunct;

    var tokens = [];
    var rules = [];
    var remove = 0;
    this.state = 0;
    this.index = 0;
    this.input = "";

    this.addRule = function (pattern, action, start) {
        var global = pattern.global;

        if (!global) {
            var flags = "g";
            if (pattern.multiline) flags += "m";
            if (pattern.ignoreCase) flags += "i";
            pattern = new RegExp(pattern.source, flags);
        }

        if (Object.prototype.toString.call(start) !== "[object Array]") start = [0];

        rules.push({
            pattern: pattern,
            global: global,
            action: action,
            start: start
        });

        return this;
    };

    this.setInput = function (input) {
        remove = 0;
        this.state = 0;
        this.index = 0;
        tokens.length = 0;
        this.input = input;
        return this;
    };

    this.lex = function () {
        if (tokens.length) return tokens.shift();

        this.reject = true;

        while (this.index <= this.input.length) {
            var matches = scan.call(this).splice(remove);
            var index = this.index;

            while (matches.length) {
                if (this.reject) {
                    var match = matches.shift();
                    var result = match.result;
                    var length = match.length;
                    this.index += length;
                    this.reject = false;
                    remove++;

                    var token = match.action.apply(this, result);
                    if (this.reject) this.index = result.index;
                    else if (typeof token !== "undefined") {
                        switch (Object.prototype.toString.call(token)) {
                        case "[object Array]":
                            tokens = token.slice(1);
                            token = token[0];
                        default:
                            if (length) remove = 0;
                            return token;
                        }
                    }
                } else break;
            }

            var input = this.input;

            if (index < input.length) {
                if (this.reject) {
                    remove = 0;
                    var token = defunct.call(this, input.charAt(this.index++));
                    if (typeof token !== "undefined") {
                        if (Object.prototype.toString.call(token) === "[object Array]") {
                            tokens = token.slice(1);
                            return token[0];
                        } else return token;
                    }
                } else {
                    if (this.index !== index) remove = 0;
                    this.reject = true;
                }
            } else if (matches.length)
                this.reject = true;
            else break;
        }
    };

    function scan() {
        var matches = [];
        var index = 0;

        var state = this.state;
        var lastIndex = this.index;
        var input = this.input;

        for (var i = 0, length = rules.length; i < length; i++) {
            var rule = rules[i];
            var start = rule.start;
            var states = start.length;

            if ((!states || start.indexOf(state) >= 0) ||
                (state % 2 && states === 1 && !start[0])) {
                var pattern = rule.pattern;
                pattern.lastIndex = lastIndex;
                var result = pattern.exec(input);

                if (result && result.index === lastIndex) {
                    var j = matches.push({
                        result: result,
                        action: rule.action,
                        length: result[0].length
                    });

                    if (rule.global) index = j;

                    while (--j > index) {
                        var k = j - 1;

                        if (matches[j].length > matches[k].length) {
                            var temple = matches[j];
                            matches[j] = matches[k];
                            matches[k] = temple;
                        }
                    }
                }
            }
        }

        return matches;
    }
}



var lexer = new Lexer;

function Token(type, lexeme) {
    this.type    = type;
    this.lexeme  = lexeme
}

var tokens = [];

// RESERVED_WORD
lexer.addRule(/(?:and|begin|break|by|call|constant|deeply|div|do|else|end|exists|for|foreach|func|global|if|in|inherited|local|loop|mod|native|not|onexception|or|repeat|return|self|then|to|try|until|while|with)/, function(lexeme) {
    TEST ? console.log("RESERVED_WORD: " + lexeme) : tokens.push(new Token("RESERVED_WORD", lexeme)); 
});

// HEX_DIGIT
lexer.addRule(/[0-9a-fA-F]/, function(lexeme) {
    tokens.push(new Token("HEX_DIGIT", lexeme)); 
});

// DIGIT
lexer.addRule(/\d/, function(lexeme) {
    tokens.push(new Token("DIGIT", lexeme)); 
});

// ALPHA
lexer.addRule(/[a-zA-Z]/, function(lexeme) {
    tokens.push(new Token("ALPHA", lexeme)); 
});

// // UNARY_OPERATOR
// lexer.addRule(/(?:-|not)/, function(lexeme) {
//     TEST ? console.log("UNARY_OPERATOR: " + lexeme) : tokens.push(new Token("UNARY_OPERATOR", lexeme)); 
// });
// 
// // STRING_OPERATOR
// lexer.addRule(/(?:&|&&)/, function(lexeme) {
//     TEST ? console.log("STRING_OPERATOR: " + lexeme) : tokens.push(new Token("STRING_OPERATOR", lexeme)); 
// });
// 
// // BOOLEAN_OPERATOR
// lexer.addRule(/(?:and|or)/, function(lexeme) {
//     TEST ? console.log("BOOLEAN_OPERATOR: " + lexeme) : tokens.push(new Token("BOOLEAN_OPERATOR", lexeme)); 
// });
// 
// // RELATIONAL_OPERATOR
// lexer.addRule(/(?:<>|<=|>=|<|>|=)/, function(lexeme) {
//     TEST ? console.log("RELATIONAL_OPERATOR: " + lexeme) : tokens.push(new Token("RELATIONAL_OPERATOR", lexeme)); 
// });
// 
// // ARITHEMETIC_OPERATOR
// lexer.addRule(/(?:\+|-|\*|\/|div|mod|<<|>>)/, function(lexeme) {
//     TEST ? console.log("ARITHEMETIC_OPERATOR: " + lexeme) : tokens.push(new Token("ARITHEMETIC_OPERATOR", lexeme)); 
// });
// 
// // BINARY_OPERATOR
// lexer.addRule(/(?:\+|-|\*|\/|div|mod|<<|>>|=|<>|<=|>=|<|>|and|or|&|&&)/, function(lexeme) {
//     TEST ? console.log("BINARY_OPERATOR: " + lexeme) : tokens.push(new Token("BINARY_OPERATOR", lexeme)); 
// });

// NON_ESCAPE_CHARACTER
lexer.addRule(/\x20-5B\x5D-\x7F/, function(lexeme) {
    tokens.push(new Token("NON_ESCAPE_CHARACTER", lexeme)); 
});

// CHARACTER
lexer.addRule(/$(?:\x20-5B\x5D-\x7F|\(?:[\nt]|[a-fA-F0-9]{2}|u[a-fA-F0-9]{4})/, function(lexeme) {
    tokens.push(new Token("CHARACTER", lexeme)); 
});

// REAL
lexer.addRule(/-?\d+\.\d*(?:[eE]-?\d+)?/, function(lexeme) {
    tokens.push(new Token("REAL", lexeme)); 
});

// INTEGER
lexer.addRule(/-?(?:0x(?:[0-9a-fA-F])+|\d+)/, function(lexeme) {
    tokens.push(new Token("INTEGER", lexeme)); 
});

// SYMBOL_CHARACTER
lexer.addRule(/[\x20-\x5B\x5D-\x7B\x7D\x7E\x7F]/, function(lexeme) {
    tokens.push(new Token("SYMBOL_CHARACTER", lexeme)); 
});


// SYMBOL
// lexer.addRule(/[a-zA-Z_]\w*/, function(lexeme) {
lexer.addRule(/(?:[a-zA-Z_]\w*|\x7C(?:[\x20-\x5B\x5D-\x7B\x7D\x7E\x7F]|\[|\])*\x7C)/, function(lexeme) {
    tokens.push(new Token("SYMBOL", lexeme)); 
});

// TRUNCATED_ESCAPE
lexer.addRule(/\\u(?:[a-fA-F0-9]{4})*/, function(lexeme) {
    tokens.push(new Token("TRUNCATED_ESCAPE", lexeme)); 
});

// ESCAPE_SEQUENCE
lexer.addRule(/(?:\["nt\]|\u(?:[0-9a-fA-F]{4})*\u)/, function(lexeme) {
    tokens.push(new Token("ESCAPE_SEQUENCE", lexeme)); 
});

// STRING_CHARACTER
lexer.addRule(/[\x20\x21\x23-\x5B\x5D-\x7F]/, function(lexeme) {
    tokens.push(new Token("STRING_CHARACTER", lexeme)); 
});

// CHARACTER_SEQUENCE
lexer.addRule(/(?:[\x20\x21\x23-\x5B\x5D-\x7F]|(?:\["nt\]|\u(?:[0-9a-fA-F]{4})*\u))*(?:\u(?:[0-9a-fA-F]{4})*)?/, function(lexeme) {
    if (lexeme === "") {
//         console.log("EMPTY_CHARACTER_SEQUENCE");
        return;
    }
    tokens.push(new Token("CHARACTER_SEQUENCE", lexeme)); 
});

// STRING
lexer.addRule(/"(?:[\x20\x21\x23-\x5B\x5D-\x7F]|(?:\["nt\]|\u(?:[0-9a-fA-F]{4})*\u))*(?:\u(?:[0-9a-fA-F]{4})*)?"/,
 function(lexeme) {
    tokens.push(new Token("STRING", lexeme));
});

// WHITE_SPACE
lexer.addRule(/\s+/, function(lexeme) {
    tokens.push(new Token("WHITE_SPACE", lexeme)); 
});

function lexNewtonScript(outputType, inputString) {
    lexer.setInput(inputString);
    lexer.lex();
    
    if (outputType === "ARRAY") {
        return tokens;
    }
    else if (outputType === "JSON") {
        var jsonString = "";
        for (i=0;i<tokens.length;i++) {
            jsonString += JSON.stringify(tokens[i]);
        }
        return jsonString;
    }
    else if (outputType === "XML") {
        var xmlString = "";
        xmlString += "<tokenlist>\n";
        for (i=0;i<tokens.length;i++) {
            xmlString += "  <token>\n";
            xmlString += "    <lexeme>" + tokens[i].lexeme + "</lexeme>\n";
            xmlString += "    <tokencategory>" + tokens[i].type + "</tokencategory>\n";
            xmlString += "  </token>\n";
        }
        xmlString += "</tokenlist>\n";
        return xmlString;
    }
}




