/*
 * Copyright 2009 Network Engine for Objects in Lund AB [neotechnology.com] This
 * program is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version. This program is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 * General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * <http://www.gnu.org/licenses/>.
 */
package org.neo4j.javascript;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

/**
 * Class for running Neo4j-enabled JavaScript code.
 * @author Anders Nawroth
 */
public class Neo4js
{
    private static final int DEFAULT_OPTIMIZATION_LEVEL = 9;
    private static final int JS_VERSION = Context.VERSION_1_7;
    private static final String SYSTEM_ERR = "err";
    private static final String SYSTEM_OUT = "out";
    private static final String NEO_JS = "src/main/javascript/neo.js";
    private Scriptable scope;
    private Context cx;

    public static void main( final String[] args ) throws IOException
    {
        Neo4js neo = new Neo4js();
        neo.init();
        neo.evaluateFile( "src/test/javascript/testNeo.js" );
        neo.exit();
    }

    public void init()
    {
        init( DEFAULT_OPTIMIZATION_LEVEL );
    }

    public void init( final int optLevel )
    {
        cx = Context.enter();
        try
        {
            cx.setLanguageVersion( JS_VERSION );
            cx.setOptimizationLevel( optLevel );
            scope = cx.initStandardObjects();
            Object wrappedOut = Context.javaToJS( System.out, scope );
            ScriptableObject.putProperty( scope, SYSTEM_OUT, wrappedOut );
            Object wrappedErr = Context.javaToJS( System.err, scope );
            ScriptableObject.putProperty( scope, SYSTEM_ERR, wrappedErr );

            evaluateFile( NEO_JS );
        }
        catch ( IOException e )
        {
            e.printStackTrace();
            Context.exit();
        }
    }

    public void exit()
    {
        Context.exit();
    }

    public String evaluateFile( final String fileName ) throws IOException
    {
        Object result = evalFile( fileName );
        return Context.toString( result );
    }

    public <T> T evaluateFile( final String fileName, final Class<T> type )
        throws IOException
    {
        Object result = evalFile( fileName );
        return type.cast( Context.jsToJava( result, type ) );
    }

    public String evaluateString( final String source, final String name )
        throws IOException
    {
        Object result = evalString( source, name );
        return Context.toString( result );
    }

    public <T> T evaluateString( final String source, final String name,
        final Class<T> type ) throws IOException
    {
        Object result = evalString( source, name );
        return type.cast( Context.jsToJava( result, type ) );
    }

    private Object evalFile( final String fileName )
        throws FileNotFoundException, IOException
    {
        Reader file = new FileReader( new File( fileName ) );
        Object result = cx.evaluateReader( scope, file, fileName, 1, null );
        return result;
    }

    private Object evalString( final String source, final String name )
    {
        Object result = cx.evaluateString( scope, source, name, 1, null );
        return result;
    }
}
