(function myGrammar() {
    "use strict";

    const createToken = chevrotain.createToken;
    const tokenMatcher = chevrotain.tokenMatcher;
    const Lexer = chevrotain.Lexer;
    const Parser = chevrotain.Parser;


    const Label = createToken({
        name: "Label",
        pattern:
        //necessary to escape: [] {} () " ; \n # | @ \n and whitespace
        //this cannot contain :: and should not partially match ::
        //--> :(?!:) : not followed by another :
        // --> x(?!y) = negative lookahead (matches 'x' when it's not followed by 'y')

        //atleast one character
        // - a : followed by a not :  = (:(?!:))
        // - normal - not necessary to escape or whitespace - characters = [^\{\|\(\)\}\<\>\[\];\\"\n#@: \t]
        // - \ followed by any character or a newline = \\(.|\n))

        //no whitespace in the beginning or end -> will be skipped (OR allow whitespace with keywords?)
        //char (whitespace* char)* char*

            /((:(?!:))|[^\{\|\(\)\}\<\>\[\];\\"\n#@: \t]|\\(.|\n))([ \t]*((:(?!:))|[^\{\|\(\)\}\<\>\[\];\\"\n#@: \t]|\\(.|\n)))*((:(?!:))|[^\{\|\(\)\}\<\>\[\];\\"\n#@: \t]|\\(.|\n))*/,

        line_breaks: true
    });

    const LineComment = createToken({
        name: "LineComment",
        pattern: /\/\/[^\n]*[\n]?/,
        group: Lexer.SKIPPED,
    });

    const BlockComment = createToken({
        name: "BlockComment",
        //between /**/
        //allowed to use * and / within text but not after each other
        //most chars = [^\*]
        //* followed by /  = /\*(?!\/))
        pattern: /\/\*([^\*]|\*(?!\/))*\*\//,
        group: Lexer.SKIPPED,
        line_breaks: true
    });

    const LCurlyBracket = createToken({
        name: "LCurlyBracket",
        pattern: /{/
    });

    const RCurlyBracket = createToken({
        name: "RCurlyBracket",
        pattern: /}/
    });

    const LRoundBracket = createToken({
        name: "LRoundBracket",
        pattern: /\(/
    });

    const RRoundBracket = createToken({
        name: "RRoundBracket",
        pattern: /\)/
    });

    const RAngleBracket = createToken({
        name: "RAngleBracket",
        pattern: />/
    });

    const LAngleBracket = createToken({
        name: "LAngleBracket",
        pattern: /</
    });

     const Comment = createToken({
        name: "Comment",
        //similar to stringliteral but between ||
        pattern: /\|([^\|\\]|\\.)*\|/
    });

  
    const DoubleColon = createToken({
        name: "DoubleColon",
        pattern: /::/
    });

    const ID = createToken({
        name: "ID",
        pattern: /@[a-z0-9_]+/i
    });

    const Literal = createToken({
        name: "Literal",
        pattern: Lexer.NA
    });

    const StringLiteral = createToken({
        name: "StringLiteral",
        //"char*" -> "char+" or ""
        //most characters = [^"]
        //escaped the " char =  \\"
        //cannot end with \ so must end with = [^\\"] or \\"
        //empty is allowed ""
        pattern: /"([^"\\]|\\.)*"/,
        categories: [Literal],
        line_breaks: true
    });

    const NumberLiteral = createToken({
        name: "NumberLiteral",
        pattern: /-?(\d+)(\.\d+)?/,
        categories: [Literal],
        longer_alt: Label,
    });

    const ColorLiteral = createToken({
        name: "ColorLiteral",
        //first the 6 , otherwise only 3 will be matched
        pattern: /#([0-9a-f]{6}|[0-9a-f]{3})/i,
        categories: [Literal]
    });
  
      const ChoiceLiteral = createToken({
        name: "ChoiceLiteral",
        //idem stringLiteral
        pattern: /\[([^\]\\]|\\.)*\]/,
        categories: [Literal],
        line_breaks: true
    });

    const Keyword = createToken({
        name: "Keyword",
        pattern: Lexer.NA
    });

    const Forever = createToken({
        name: "Forever",
        pattern: /forever/i,
        longer_alt: Label,
        categories: [Keyword]
    });

    const End = createToken({
        name: "End",
        pattern: /end/i,
        longer_alt: Label,
        categories: [Keyword]
    });

    const Then = createToken({
        name: "Then",
        pattern: /then/i,
        longer_alt: Label,
        categories: [Keyword]
    });

    const Repeat = createToken({
        name: "Repeat",
        pattern: /repeat/i,
        longer_alt: Label,
        categories: [Keyword]
    });
    const RepeatUntil = createToken({
        name: "RepeatUntil",
        pattern: /repeat[ \t]+until/i,
        longer_alt: Label,
        categories: [Keyword]
    });

    const If = createToken({
        name: "If",
        pattern: /if/i,
        longer_alt: Label,
        categories: [Keyword]
    });

    const Else = createToken({
        name: "Else",
        pattern: /else/i,
        longer_alt: Label,
        categories: [Keyword]
    });


// marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
    const WhiteSpace = createToken({
        name: "WhiteSpace",
        pattern: /[ \t]+/,
        group: Lexer.SKIPPED,
        line_breaks: false
    });

    const Delimiter = createToken({
        name: "Delimiter",
        pattern: /;[ \t]*\n|;|\n/,
        line_breaks: true
    });

    //order matters!
    const allTokens = [
        WhiteSpace,
        LineComment, BlockComment, Comment,  //match before anything else
        Literal, StringLiteral, NumberLiteral, ColorLiteral, ChoiceLiteral,
        Forever, End, Repeat, If, Else, Then, RepeatUntil,
        Delimiter,
        Label,
        LCurlyBracket, RCurlyBracket,
        LRoundBracket, RRoundBracket,
        RAngleBracket, LAngleBracket,
        //LSquareBracket, RSquareBracket,
        DoubleColon, ID
    ];

    const LNLexer = new Lexer(allTokens);


    // ----------------- parser -----------------
// Note that this is a Pure grammar, it only describes the grammar
// Not any actions (semantics) to perform during parsing.
    function LNParser(input) {
        Parser.call(this, input, allTokens, {
            outputCst: true
        });

        const $ = this;

        $.RULE("code", () => {

            $.MANY({
                DEF: () => {
                    $.CONSUME(Delimiter);
                }
            });
            $.OPTION3(() => {
                $.SUBRULE($.comments);
            })
            $.OPTION(() => {

                $.SUBRULE($.stack);

                $.MANY2({
                    DEF: () => {
                        //$.CONSUME2(Delimiter);
                        $.AT_LEAST_ONE({
                            DEF: () => {

                                $.OR([{
                                    ALT: () => {
                                        $.CONSUME3(Delimiter);
                                    }
                                }, {
                                    ALT: () => {
                                        $.SUBRULE2($.comments);
                                    }
                                }]);
                            }
                        });
                        $.OPTION2(() => {
                            $.SUBRULE2($.stack);
                        })

                    }
                });

                //$.MANY3(() => {
                //   $.CONSUME4(Delimiter);
                //})
            })

            //$.CONSUME(chevrotain.EOF);
        });

        $.RULE("comments", () => {
            $.AT_LEAST_ONE(() => {
                $.CONSUME(Comment);
                $.MANY2(() => {
                    $.CONSUME2(Delimiter);
                })
            });

        })

        $.RULE("stack", () => {
            $.SUBRULE($.block);


            $.MANY(() => {
                $.CONSUME(Delimiter);
                $.SUBRULE2($.block);
            });

            $.OPTION(() => {
                $.CONSUME2(Delimiter);
            })
        });

        $.RULE("block", () => {
            $.OR([{
                NAME: "$atomic",
                ALT: () => {
                    $.SUBRULE($.atomic);
                }
            }, {
                NAME: "$composite",
                ALT: () => {
                    $.SUBRULE($.composite);
                }
            }]);
        });


        $.RULE("atomic", () => {
            $.AT_LEAST_ONE(() => {
                $.OR([{
                    ALT: () => {
                        $.CONSUME(Label);
                    }
                }, {
                    ALT: () => {
                        $.SUBRULE($.argument);
                    }
                }]);

            });

            $.SUBRULE($.modifier);


            $.SUBRULE($.annotations);

        });

        $.RULE("composite", () => {
            $.OR([{
                NAME: "$ifelse",
                ALT: () => {
                    $.SUBRULE($.ifelse);
                }
            }, {
                NAME: "$forever",
                ALT: () => {
                    $.SUBRULE($.forever);
                }
            }, {
                NAME: "$repeat",
                ALT: () => {
                    $.SUBRULE($.repeat);
                }
            }, {
                NAME: "$repeatuntil",
                ALT: () => {
                    $.SUBRULE($.repeatuntil);
                }
            }]);
        });

        $.RULE("ifelse", () => {
            $.CONSUME(If);
            $.SUBRULE($.condition);
            $.OPTION(() => {
                $.CONSUME(Then);
            });
            $.SUBRULE($.annotations);
            $.SUBRULE($.clause);
            $.OPTION3(() => {
                $.CONSUME(Else);
                $.SUBRULE3($.clause);
            });

        });

        $.RULE("forever", () => {
            $.CONSUME(Forever);
            $.SUBRULE($.annotations);
            $.SUBRULE($.clause);

        });


        $.RULE("repeat", () => {
            $.CONSUME(Repeat);
            $.SUBRULE($.argument);
            $.SUBRULE($.annotations);
            $.SUBRULE($.clause);

        });

        $.RULE("repeatuntil", () => {
            $.CONSUME(RepeatUntil);
            $.SUBRULE($.condition);
            $.SUBRULE($.annotations);
            $.SUBRULE($.clause);
        });




        $.RULE("clause", () => {
            $.OPTION(() => {
                $.CONSUME(Delimiter);
            });
            $.OPTION2(() => {
                $.SUBRULE($.stack);
            });

            $.OPTION3(() => {
                //$.CONSUME2(Delimiter);
                $.CONSUME(End);
            })
        });

        $.RULE("modifier", () => {
            $.OPTION(() => {
                $.CONSUME(DoubleColon);
                $.CONSUME(Label);
            })
        });
      
        $.RULE("annotations", () => {
            $.OPTION(() => {
                $.OR([{
                    ALT: () => {
                        $.CONSUME(Comment);
                        $.OPTION2(() => {
                            $.CONSUME(ID);
                        });

                    }
                }, {
                    ALT: () => {
                        $.CONSUME2(ID);
                        $.OPTION3(() => {
                            $.CONSUME2(Comment);
                        });
                    }
                }]);
            })
        })

        $.RULE("argument", () => {
            $.OR([{
                ALT: () => {
                    $.CONSUME(LCurlyBracket);
                    $.OPTION(() => {
                        $.OR2([{
                            ALT: () => {
                                $.CONSUME(Literal);
                            }
                        }, {
                            ALT: () => {
                                $.SUBRULE($.expression);
                            }
                        }, {
                            ALT: () => {
                                $.SUBRULE($.predicate);
                            }
                        }]);
                    });
                    $.OPTION2(() => {
                        $.CONSUME(ID);
                    });
                    $.CONSUME(RCurlyBracket);
                }
            }, {
                ALT: () => {
                    $.OR3([{
                        ALT: () => {
                            $.CONSUME(StringLiteral);
                        }
                    }, {
                        ALT: () => {
                            $.CONSUME(ColorLiteral);
                        }
                    }, {
                        ALT: () => {
                            $.CONSUME(ChoiceLiteral);
                        }
                    }, {
                        ALT: () => {
                            $.SUBRULE2($.expression);
                        }
                    }, {
                        ALT: () => {
                            $.SUBRULE2($.predicate);
                        }
                    }]);
                }
            }])

        });

       $.RULE("condition", () => {
            $.OR([{
                ALT: () => {
                    $.CONSUME(LCurlyBracket);
                    $.OPTION(() => {
                        $.SUBRULE($.predicate);

                    });
                    $.OPTION2(() => {
                        $.CONSUME(ID);
                    });
                    $.CONSUME(RCurlyBracket);
                }
            }, {
                ALT: () => {
                    $.SUBRULE2($.predicate);
                }
            }])
        })

        $.RULE("expression", () => {
            $.CONSUME(LRoundBracket);
            $.OPTION(() => {
                $.SUBRULE($.atomic);
            });
            $.CONSUME(RRoundBracket);
        });


        $.RULE("predicate", () => {
            $.CONSUME(LAngleBracket);
            $.OPTION(() => {
                $.SUBRULE($.atomic);
            });
            $.CONSUME(RAngleBracket);
        });


        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    LNParser.prototype = Object.create(Parser.prototype);
    LNParser.prototype.constructor = LNParser;

// wrapping it all together
// reuse the same parser instance.
    const lnparser = new LNParser([]);

    // ----------------- Interpreter -----------------
    //TODO

    // for the playground to work the returned object must contain these fields
    return {
        lexer: LNLexer,
        parser: LNParser,
        //visitor: InformationVisitor,
        defaultRule: "code"
    };
}())