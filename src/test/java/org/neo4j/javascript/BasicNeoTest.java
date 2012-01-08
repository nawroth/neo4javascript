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

import static org.junit.Assert.assertEquals;

import java.io.IOException;

import org.junit.Test;
import org.neo4j.javascript.testbase.Neo4jsTestCase;

public class BasicNeoTest extends Neo4jsTestCase
{

    public BasicNeoTest() throws Exception
    {
        super( "BasicNeoTest.js" );
    }

    @Test
    public void testNeo() throws Exception
    {
        // just see if this stuff loads w/o throwing exceptions
        String result = evalFile( "testNeo.js" );
        // returns nothing a.k.a. undefined
        assertEquals( "undefined", result );
    }

    @Test
    public void neoName() throws IOException
    {
        eval( "createNodeSpace()" );
        assertEquals( "Thomas Andersson", eval( "neoName()" ) );
    }

    @Test
    public void neoAge() throws IOException
    {
        eval( "createNodeSpace()" );
        assertEquals( new Double( 29 ), eval( "neoAge()", Double.class ) );
    }

    @Test
    public void nodeTypeIsNode() throws IOException
    {
        assertEquals( new Boolean( true ), eval( "nodeInstanceTypeIsNode()",
                Boolean.class ) );
    }

    @Test
    public void relationshipTypeIsNotNode() throws IOException
    {
        eval( "createNodeSpace()" );
        assertEquals( new Boolean( false ), eval(
                "relationshipInstanceTypeIsNotNode()", Boolean.class ) );
    }

    @Test
    public void nodeTypeIsNotRelationship() throws IOException
    {
        assertEquals( new Boolean( false ), eval(
                "nodeInstanceTypeIsNotRelationship()", Boolean.class ) );
    }

    @Test
    public void relationshipTypeIsRelationship() throws IOException
    {
        eval( "createNodeSpace()" );
        assertEquals( new Boolean( true ), eval(
                "relationshipInstanceTypeIsRelationship()", Boolean.class ) );
    }

    @Test
    public void printFriends() throws IOException
    {
        eval( "createNodeSpace()" );
        assertEquals( new Integer( 4 ), eval( "printNeoFriends()",
                Integer.class ) );
    }

    @Test
    public void printMatrixHackers() throws IOException
    {
        eval( "createNodeSpace()" );
        assertEquals( "The Architect", eval( "printMatrixHackers()" ) );
    }
}
