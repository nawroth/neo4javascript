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
package org.neo4j.javascript.testbase;

import java.io.IOException;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.neo4j.javascript.Neo4js;

/**
 * Base test class for Neo4js.
 * @author Anders Nawroth
 */
public abstract class Neo4jsTestCase
{
    private static final String JS_DIR = "src/test/javascript/";

    private String testName = "(initializing)";
    private static final Neo4js neo4js = new Neo4js();

    public Neo4jsTestCase( final String testClass )
    {
        this.testName = testClass;
    }

    protected String evalFile( final String fileName ) throws IOException
    {
        return neo4js.evaluateFile( JS_DIR + fileName );
    }

    protected <T> T evalFile( final String fileName, final Class<T> returnType )
        throws IOException
    {
        return neo4js.evaluateFile( JS_DIR + fileName, returnType );
    }

    protected String eval( final String source ) throws IOException
    {
        return neo4js.evaluateString( source, testName );
    }

    protected <T> T eval( final String source, final Class<T> returnType )
        throws IOException
    {
        return neo4js.evaluateString( source, testName, returnType );
    }

    protected String evalTx( final String source ) throws IOException
    {
        final String wrappedSource = "service.transaction( function( neo, index ){"
            + source + "});";
        return eval( wrappedSource );
    }

    protected <T> T evalTx( final String source, final Class<T> returnType )
        throws IOException
    {
        final String wrappedSource = "service.transaction( function( neo, index ){"
            + source + "});";
        return returnType.cast( eval( wrappedSource, returnType ) );
    }

    @BeforeClass
    public static void setUpClass() throws IOException
    {
        neo4js.init();
        neo4js.evaluateFile( JS_DIR + "util.js" );
        neo4js.evaluateString(
            "var service = Neo4js.createService( 'target/neo-db' );",
            "(test setup)" );
    }

    @Before
    public void setUp() throws IOException
    {
        if ( testName.endsWith( ".js" ) )
        {
            evalFile( testName );
        }
    }

    @After
    public void tearDown() throws IOException
    {
        eval( "Neo4js.util.test.cleanNodespace(service);" );
    }

    @AfterClass
    public static void tearDownClass() throws IOException
    {
        neo4js.evaluateString( "service.shutdown();", "(test teardown)" );
        neo4js.exit();
    }
}
